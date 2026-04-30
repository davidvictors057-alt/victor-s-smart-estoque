import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mpipe
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
import os
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações do Modelo MediaPipe
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite"
MODEL_PATH = "efficientdet.tflite"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("[CORE] Baixando modelo MediaPipe...")
        r = requests.get(MODEL_URL)
        with open(MODEL_PATH, "wb") as f:
            f.write(r.content)

download_model()

# Inicializar o Detector de Objetos
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.ObjectDetectorOptions(base_options=base_options, score_threshold=0.3)
detector = vision.ObjectDetector.create_from_options(options)

@app.post("/audit")
async def audit_frame(file: UploadFile = File(...)):
    start_time = time.time()
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]

    # Converter OpenCV (BGR) para MediaPipe (RGB)
    mp_image = mpipe.Image(image_format=mpipe.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    
    # Realizar Detecção
    detection_result = detector.detect(mp_image)
    
    detections = []
    for detection in detection_result.detections:
        bbox = detection.bounding_box
        category = detection.categories[0]
        
        detections.append({
            "bbox": [int(bbox.origin_x), int(bbox.origin_y), int(bbox.origin_x + bbox.width), int(bbox.origin_y + bbox.height)],
            "class": category.category_name,
            "confidence": category.score
        })

    latency = (time.time() - start_time) * 1000
    return {
        "status": "success",
        "count": len(detections),
        "detections": detections,
        "latency_ms": round(latency, 2),
        "engine": "MediaPipe_TFLite"
    }

@app.get("/health")
async def health():
    return {"status": "online", "engine": "MediaPipe_TFLite", "ready": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
