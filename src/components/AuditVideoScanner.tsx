import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Zap, RotateCcw, StopCircle, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { visionService, Detection } from "@/services/visionService";
import { VisionOverlay } from "./VisionOverlay";

interface AuditVideoScannerProps {
  onComplete: (video: { data: string; mimeType: string }) => void;
  onCancel: () => void;
}

export const AuditVideoScanner = ({ onComplete, onCancel }: AuditVideoScannerProps) => {
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isVisionOnline, setIsVisionOnline] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isProcessingSnapshot, setIsProcessingSnapshot] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();
    checkVisionCore();
    return () => stopCamera();
  }, []);

  const checkVisionCore = async () => {
    const online = await visionService.checkHealth();
    setIsVisionOnline(online);
    if (!online) {
      toast.warning("Vision Core Offline: Rodando apenas modo nuvem.");
    } else {
      toast.success("Vision Core Conectado: Precisão Local Ativada.");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Erro ao acessar câmera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const takeSnapshotAudit = async () => {
    if (!videoRef.current || !isVisionOnline) return;

    setIsProcessingSnapshot(true);
    setDetections([]);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const result = await visionService.auditFrame(blob);
        if (result && result.status === "success") {
          setDetections(result.detections);
          toast.success(`${result.count} objetos detectados localmente!`);
        }
        setIsProcessingSnapshot(false);
      }, "image/jpeg", 0.95);

    } catch (err) {
      toast.error("Erro na auditoria local.");
      setIsProcessingSnapshot(false);
    }
  };

  const confirmLocalAudit = () => {
    if (detections.length === 0) return;
    
    const identified = detections.reduce((acc: any[], det) => {
      const existing = acc.find(i => i.name === det.class);
      if (existing) {
        existing.qty += 1;
      } else {
        acc.push({ name: det.class, qty: 1 });
      }
      return acc;
    }, []);

    onComplete({ data: "LOCAL_AUDIT_DATA", mimeType: JSON.stringify(identified) });
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        onComplete({ data: base64, mimeType: "video/webm" });
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setTimeLeft(10);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.info("Processando vídeo de alta fidelidade...");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="h-full w-full object-cover opacity-80"
        />
        
        {/* Overlay de Detecções Locais */}
        <VisionOverlay detections={detections} videoRef={videoRef} />

        {/* Camada Tática */}
        <div className="absolute inset-0 tactical-grid opacity-20 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 border-2 border-white/10 rounded-[3rem] relative">
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-3xl" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-3xl" />
          </div>
        </div>

        {/* Botão de Confirmação Local */}
        <AnimatePresence>
          {detections.length > 0 && !recording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-32 left-0 right-0 flex justify-center"
            >
              <button 
                onClick={confirmLocalAudit}
                className="bg-primary px-8 py-3 rounded-full font-black text-black shadow-glow-cyan flex items-center gap-2 uppercase tracking-tighter text-xs animate-bounce"
              >
                <Zap className="h-4 w-4" /> Enviar {detections.length} Itens para Hub
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status da Gravação / Vision Core */}
        <div className="absolute top-10 left-0 right-0 flex flex-col items-center gap-3">
          <AnimatePresence>
            {recording && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-rose-600/90 backdrop-blur-md px-6 py-2 rounded-full shadow-glow-rose"
              >
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                <span className="font-mono-tactical text-[10px] font-black text-white uppercase tracking-[0.3em]">
                  GRAVANDO: {timeLeft}S
                </span>
              </motion.div>
            )}

            {!recording && isVisionOnline && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30"
              >
                <Zap className="h-3 w-3 text-primary animate-pulse" />
                <span className="font-mono-tactical text-[9px] font-black text-primary uppercase tracking-widest">
                  DEEP VISION v3.1 ATIVA (YOLO-ONNX)
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading Snapshot */}
        <AnimatePresence>
          {isProcessingSnapshot && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <Search className="h-10 w-10 text-primary animate-bounce" />
                <span className="text-white font-black text-[10px] uppercase tracking-widest">Scanner YOLO Ativo...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controles */}
      <div className="bg-black-piano p-8 flex items-center justify-between gap-4 border-t border-white/5">
        <button 
          onClick={onCancel}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white hover:text-white transition-all"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        {!recording ? (
          <>
            <button 
              onClick={takeSnapshotAudit}
              disabled={!isVisionOnline || isProcessingSnapshot}
              className="flex-1 h-16 rounded-2xl bg-white/5 border border-primary/20 font-black text-primary shadow-glow-cyan flex flex-col items-center justify-center gap-1 active:scale-95 transition-all uppercase tracking-widest text-[9px] disabled:opacity-20"
            >
              <Eye className="h-5 w-5" /> Audit Local
            </button>

            <button 
              onClick={startRecording}
              className="flex-1 h-16 rounded-2xl bg-primary font-black text-black shadow-glow-cyan flex flex-col items-center justify-center gap-1 active:scale-95 transition-all uppercase tracking-widest text-[9px]"
            >
              <Camera className="h-5 w-5" /> Vídeo 10s
            </button>
          </>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex-1 h-16 rounded-2xl bg-rose-600 font-black text-white shadow-glow-rose flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            <StopCircle className="h-6 w-6" /> Finalizar Agora
          </button>
        )}

        <div className={`h-16 w-16 flex items-center justify-center rounded-2xl transition-all ${isVisionOnline ? 'bg-primary/20 text-primary shadow-glow-cyan' : 'bg-white/5 text-white/20'}`}>
          <Zap className={`h-6 w-6 ${isVisionOnline ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </div>
  );
};
