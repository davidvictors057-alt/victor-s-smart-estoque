import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanLine, Zap, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { ManualInputModal } from "./ManualInputModal";
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface CameraViewProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  mode?: "scan" | "photo";
  onCapture?: (dataUrl: string) => void;
  onScan?: (code: string) => void;
  multiCapture?: boolean;
  multiScan?: boolean;
  capturedCount?: number;
  onFinalize?: () => void;
}

/**
 * Real device camera using getUserMedia.
 * Must be launched directly inside a user gesture (click) to avoid
 * silent permission failures.
 */
export const CameraView = ({
  open,
  onClose,
  title = "Câmera Tática",
  mode = "scan",
  onCapture,
  onScan,
  multiCapture = false,
  multiScan = false,
  capturedCount = 0,
  onFinalize,
}: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const start = async () => {
      setError(null);
      setReady(false);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Câmera não suportada neste dispositivo / navegador.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
          
          if (mode === 'scan') {
            const reader = new BrowserMultiFormatReader();
            controlsRef.current = await reader.decodeFromVideoElement(videoRef.current, (result, err) => {
              if (result && !cancelled) {
                // Tactical Feedback: Beep + Haptic
                try {
                  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                  if (AudioContextClass) {
                    const audioCtx = new AudioContextClass();
                    const oscillator = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
                    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
                    oscillator.connect(gain);
                    gain.connect(audioCtx.destination);
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.1);
                  }
                  if (navigator.vibrate) navigator.vibrate(60);
                } catch (e) {
                  console.warn("Feedback audio/tátil falhou:", e);
                }

                const code = result.getText();
                const now = Date.now();
                const lastScan = lastScanRef.current;
                
                // Intervalo de 2s solicitado pelo usuário
                if (lastScan && lastScan.code === code && (now - lastScan.time) < 2000) return;

                lastScanRef.current = { code, time: now };
                
                // Feedback visual de "Adicionado"
                setScanFeedback(code);
                setTimeout(() => setScanFeedback(null), 1500);

                onScan?.(code);
                if (!multiScan) onClose();
              }
            });
          }
        }
      } catch (e: any) {
        if (e?.name === "NotAllowedError") {
          setError("Permissão da câmera negada. Habilite nas configurações do navegador.");
        } else if (e?.name === "NotFoundError") {
          setError("Nenhuma câmera detectada no dispositivo.");
        } else {
          setError(e?.message ?? "Falha ao iniciar a câmera.");
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.85);
    onCapture?.(url);
    if (!multiCapture) {
      onClose();
    }
  };

  const handleManualSubmit = (code: string) => {
    onScan?.(code);
    onClose();
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onCapture?.(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="glass-panel-strong relative z-10 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                {mode === "scan" ? <ScanLine className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-mono-tactical text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  {mode === "scan" ? "Scanner ao vivo" : "Captura"}
                </div>
                <div className="text-sm font-bold text-foreground">{title}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
              aria-label="Fechar câmera"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

            {/* Video */}
          <div className="relative flex-1 overflow-hidden bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Scan Feedback Animation */}
            <AnimatePresence>
              {scanFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <div className="bg-success/90 backdrop-blur-xl px-8 py-4 rounded-3xl border-2 border-white/20 shadow-[0_0_50px_rgba(34,197,94,0.5)] flex flex-col items-center">
                    <CheckCircle2 className="h-12 w-12 text-black mb-2 stroke-[3]" />
                    <span className="text-black font-black uppercase tracking-tighter text-xl italic">ADICIONADO</span>
                    <span className="text-black/60 font-mono-tactical text-[10px] mt-1">{scanFeedback}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* tactical overlay */}
            <div className="pointer-events-none absolute inset-0">
              <div className="tactical-corner absolute inset-8 rounded-2xl" />
              {(mode === "scan" || title.includes("IA")) && (
                <>
                  <div className="absolute left-1/2 top-1/2 h-48 w-72 max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-primary/70 shadow-glow-cyan" />
                  <div className="absolute left-1/2 top-1/2 h-48 w-72 max-w-[80vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl">
                    <div className="animate-scan absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_18px_hsl(180_100%_50%/0.9)]" />
                  </div>
                </>
              )}
              <div className="absolute left-4 top-4 font-mono-tactical text-[10px] uppercase tracking-[0.3em] text-primary/80">
                CAM · {facing === "environment" ? "REAR" : "FRONT"}
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-1.5 font-mono-tactical text-[10px] uppercase tracking-widest text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> LIVE
              </div>
              {!ready && !error && (
                <div className="absolute inset-0 flex items-center justify-center font-mono-tactical text-xs uppercase tracking-widest text-primary">
                  Inicializando câmera…
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <AlertCircle className="h-10 w-10 text-danger" />
                  <p className="text-sm text-foreground">{error}</p>
                  <p className="font-mono-tactical text-[10px] uppercase tracking-widest text-muted-foreground">
                    Toque em fechar e tente novamente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input Modal */}
          <ManualInputModal 
            open={manualOpen} 
            onClose={() => setManualOpen(false)} 
            onConfirm={handleManualSubmit} 
          />

          {/* Controls */}
          <div className="glass-panel-strong relative z-10 flex items-center justify-around px-4 py-5 pb-10">
            <button
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-foreground hover:bg-white/10"
              aria-label="Trocar câmera"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {multiCapture || (mode === 'scan' && multiScan) ? (
              <div className="flex flex-col items-center">
                <span className="font-mono-tactical text-[10px] text-primary font-black mb-1">{capturedCount} ITENS</span>
                <div className="h-1 w-8 bg-primary/20 rounded-full" />
              </div>
            ) : (
              <div className="w-12" />
            )}

            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={mode === "photo" ? handleCapture : (multiScan ? onFinalize : () => {})}
                disabled={!ready}
                className={`flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-2xl transition-all ${
                  mode === 'photo' 
                  ? 'border-primary bg-primary/20 shadow-glow-cyan' 
                  : 'border-success bg-success/20 shadow-glow-green'
                } disabled:opacity-40`}
                aria-label={mode === "photo" ? "Capturar" : "Scanner Ativo"}
              >
                {mode === "photo" ? (
                  <div className="h-12 w-12 rounded-full bg-primary shadow-[0_0_20px_rgba(0,163,255,0.6)]" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <ScanLine className={`h-8 w-8 text-success ${ready ? 'animate-pulse' : ''}`} />
                    {multiScan && capturedCount > 0 && (
                      <motion.div 
                        layoutId="counter"
                        className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-black"
                      >
                        {capturedCount}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.button>
              
              {(multiCapture || multiScan) && capturedCount > 0 && (
                <motion.button
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  onClick={onFinalize}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 bg-success py-3 px-8 rounded-full text-black font-black text-[10px] shadow-[0_0_30px_rgba(34,197,94,0.4)] uppercase tracking-widest flex items-center gap-2 whitespace-nowrap z-20 border-2 border-white/20"
                >
                  <Zap className="h-3 w-3" />
                  CONCLUIR LOTE
                </motion.button>
              )}
            </div>

            <button
              onClick={() => mode === "photo" ? fileInputRef.current?.click() : onClose()}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-foreground hover:bg-white/10 transition-all active:scale-95 ${mode !== 'photo' ? 'hover:text-danger' : 'hover:text-primary'}`}
            >
              {mode === "photo" ? (
                <div className="flex flex-col items-center gap-0.5">
                  <ImageIcon className="h-5 w-5" />
                  <span className="font-mono-tactical text-[7px] font-black uppercase">Galeria</span>
                </div>
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={handleGalleryUpload} 
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
