import { useEffect, useRef } from "react";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  confidence: number;
}

interface VisionOverlayProps {
  detections: Detection[];
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const VisionOverlay = ({ detections, videoRef }: VisionOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Sincronizar tamanho do canvas com o vídeo
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calcular fator de escala (o vídeo pode estar sendo redimensionado no CSS)
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;

      detections.forEach((det) => {
        const [x1, y1, x2, y2] = det.bbox;
        const w = (x2 - x1) * scaleX;
        const h = (y2 - y1) * scaleY;
        const x = x1 * scaleX;
        const y = y1 * scaleY;

        // Estilo Neon Verde (Victor Stock Style)
        ctx.strokeStyle = "#00FFC2";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Label
        ctx.fillStyle = "rgba(0, 255, 194, 0.8)";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
        const textWidth = ctx.measureText(label).width;
        
        ctx.fillRect(x, y - 20, textWidth + 10, 20);
        ctx.fillStyle = "#000000";
        ctx.fillText(label, x + 5, y - 5);
      });
    };

    draw();
    // Poderia usar requestAnimationFrame se quiséssemos real-time, 
    // mas o usuário pediu em background por enquanto.
  }, [detections, videoRef]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};
