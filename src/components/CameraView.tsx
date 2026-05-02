import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanLine, Zap, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon, Hash } from "lucide-react";
import { ManualInputModal } from "./ManualInputModal";
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { compressImage } from "@/utils/imageProcessor";

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

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const rawUrl = canvas.toDataURL("image/jpeg", 0.95);
    
    // Optimize for AI throughput (~150KB target)
    const optimizedUrl = await compressImage(rawUrl, 1280, 0.75);
    
    onCapture?.(optimizedUrl);
    if (!multiCapture) {
      onClose();
    }
  };

  const handleManualSubmit = (code: string) => {
    onScan?.(code);
    if (!multiScan) {
      onClose();
    } else {
      setManualOpen(false);
      // Feedback visual de "Adicionado via Teclado"
      setScanFeedback(code);
      setTimeout(() => setScanFeedback(null), 1000);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      // Optimize gallery uploads too
      const optimizedUrl = await compressImage(dataUrl, 1280, 0.75);
      onCapture?.(optimizedUrl);
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
          {/* Header - Fixed at Top with High Z-Index */}
          <div className="glass-panel-strong relative z-[60] flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)]">
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

            {/* Scan Feedback Animation - Centered and Non-Obstructive */}
            <AnimatePresence>
              {scanFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-50 pointer-events-none px-6"
                >
                  <div className="bg-success/90 backdrop-blur-xl px-6 py-4 rounded-[2rem] border-2 border-white/20 shadow-[0_0_50px_rgba(34,197,94,0.5)] flex flex-col items-center max-w-[280px]">
                    <CheckCircle2 className="h-10 w-10 text-black mb-2 stroke-[3]" />
                    <span className="text-black font-black uppercase tracking-tighter text-lg italic text-center leading-none">ADICIONADO</span>
                    <span className="text-black/60 font-mono-tactical text-[9px] mt-1 truncate w-full text-center">{scanFeedback}</span>
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

          {/* Tactical Controls HUD - Completely Redesigned for Mobile Optimization */}
          <div className="glass-panel-strong relative z-10 p-4 pb-8 sm:pb-10">
            <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
              
              {/* Left Wing: Camera Flip */}
              <button
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-foreground transition-all active:scale-90"
                aria-label="Trocar câmera"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              {/* Center Command: Action Cluster */}
              <div className="flex items-center gap-3">
                {/* Manual Trigger (Internal Code) - ALWAYS VISIBLE IN SCAN MODE */}
                {mode === "scan" && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setManualOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary shadow-glow-cyan-sm transition-all active:scale-90"
                  >
                    <Hash className="h-5 w-5" />
                  </motion.button>
                )}

                {/* Main Action Trigger */}
                <div className="relative group">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={mode === "photo" ? handleCapture : (multiScan ? onFinalize : () => {})}
                    disabled={!ready}
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-2xl transition-all ${
                      mode === 'photo' 
                      ? 'border-primary bg-primary/20 shadow-glow-cyan' 
                      : 'border-success bg-success/20 shadow-glow-green'
                    } disabled:opacity-40`}
                  >
                    {mode === "photo" ? (
                      <div className="h-12 w-12 rounded-full bg-primary shadow-glow-cyan animate-pulse-slow" />
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <ScanLine className={`h-8 w-8 text-success ${ready ? 'animate-pulse' : ''}`} />
                      </div>
                    )}
                  </motion.button>

                  {/* Multi-mode Counter Indicator */}
                  {(multiCapture || multiScan) && capturedCount > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-black shadow-lg"
                    >
                      {capturedCount}
                    </motion.div>
                  )}
                </div>

                {/* Finalize Batch Button - Positioned Side-by-Side instead of overlapping */}
                {(multiCapture || multiScan) && capturedCount > 0 && (
                  <motion.button
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    onClick={onFinalize}
                    className="flex h-12 px-5 items-center justify-center rounded-2xl bg-success text-black font-black text-[10px] shadow-glow-green uppercase tracking-widest gap-2 transition-all active:scale-90 border-2 border-white/20"
                  >
                    <Zap className="h-4 w-4" />
                    PRONTO
                  </motion.button>
                )}
              </div>

              {/* Right Wing: Gallery or Close */}
              <button
                onClick={() => mode === "photo" ? fileInputRef.current?.click() : onClose()}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-foreground transition-all active:scale-90 ${mode !== 'photo' ? 'hover:text-danger' : 'hover:text-primary'}`}
              >
                {mode === "photo" ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </button>
            </div>

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
