import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Zap, RotateCcw, StopCircle } from "lucide-react";
import { toast } from "sonner";

interface AuditVideoScannerProps {
  onComplete: (video: { data: string; mimeType: string }) => void;
  onCancel: () => void;
}

export const AuditVideoScanner = ({ onComplete, onCancel }: AuditVideoScannerProps) => {
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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

        {/* Status da Gravação */}
        <div className="absolute top-10 left-0 right-0 flex flex-col items-center gap-2">
          <AnimatePresence>
            {recording && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-rose-600/90 backdrop-blur-md px-6 py-2 rounded-full shadow-glow-rose"
              >
                <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                <span className="font-mono-tactical text-xs font-black text-white uppercase tracking-[0.3em]">
                  GRAVANDO: {timeLeft}S
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-black-piano p-8 flex items-center justify-between gap-6 border-t border-white/5">
        <button 
          onClick={onCancel}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white hover:text-white transition-all"
        >
          <RotateCcw className="h-6 w-6" />
        </button>

        {!recording ? (
          <button 
            onClick={startRecording}
            className="flex-1 h-16 rounded-2xl bg-primary font-black text-black shadow-glow-cyan flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            <Camera className="h-6 w-6" /> Iniciar Gravação
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex-1 h-16 rounded-2xl bg-rose-600 font-black text-white shadow-glow-rose flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs"
          >
            <StopCircle className="h-6 w-6" /> Finalizar Agora
          </button>
        )}

        <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-ai/10 text-ai border border-ai/20 shadow-glow-cyan">
          <Zap className="h-6 w-6 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
