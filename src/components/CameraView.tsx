import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanLine, Zap, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon, Hash, Keyboard, Search } from "lucide-react";
import { ManualInputModal } from "./ManualInputModal";
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { compressImage } from "@/utils/imageProcessor";
import TacticalSearchHUD from "@/components/TacticalSearchHUD";

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

export const CameraView = ({
  open,
  onClose,
  title,
  mode = "scan",
  onCapture,
  onScan,
  multiCapture = false,
  multiScan = false,
  capturedCount = 0,
  onFinalize
}: CameraViewProps) => {
  const [torch, setTorch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bloqueio de scroll ULTRA-AGRESSIVO para Mobile
  useLayoutEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        const top = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
        if (top) {
          window.scrollTo(0, parseInt(top || '0') * -1);
        }
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "scan") return;

    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;

    const startScanning = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError("Nenhuma câmera encontrada.");
          return;
        }

        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('traseira') ||
          device.label.toLowerCase().includes('environment')
        ) || videoInputDevices[0];

        const controls = await codeReader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current!,
          (result, err) => {
            if (result && isMounted) {
              const code = result.getText();
              handleScan(code);
            }
          }
        );
        
        controlsRef.current = controls;
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        setError("Erro ao acessar a câmera.");
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [open, mode]);

  const handleScan = (code: string) => {
    setScanFeedback(code);
    onScan?.(code);

    // Feedback visual apenas para indicação de leitura
    setTimeout(() => {
      setScanFeedback(null);
    }, 1000);

    if (!multiScan) {
      onClose();
    }
  };

  const toggleTorch = async () => {
    if (controlsRef.current) {
      try {
        await controlsRef.current.switchTorch(!torch);
        setTorch(!torch);
      } catch (e) {
        console.warn("Lanterna não suportada");
      }
    }
  };

  const handleManualSubmit = (code: string) => {
    if (!code) return;
    onScan?.(code);
    
    if (!multiScan) {
      onClose();
    } else {
      setManualOpen(false);
      setScanFeedback(code);
      setTimeout(() => setScanFeedback(null), 1000);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture?.(dataUrl);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const optimizedUrl = await compressImage(dataUrl, 1280, 0.75);
      onCapture?.(optimizedUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden"
          >
            {/* Header - Fixed at Top */}
            <div className="glass-panel-strong relative z-[60] flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {mode === "scan" ? <ScanLine className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    {title || (mode === "scan" ? "Scanner Tático" : "Captura Visual")}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-primary/60">SISTEMA ATIVO</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
              {mode === "scan" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="relative h-64 w-64">
                    <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary/40" />
                    <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary/40" />
                    <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary/40" />
                    <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary/40" />
                    <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 animate-scan bg-primary/20" />
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />

              {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-8 text-center">
                  <div className="max-w-xs space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-danger" />
                    <p className="font-mono-tactical text-xs font-bold uppercase tracking-widest text-white">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="neon-blue-border rounded-xl bg-primary/10 px-6 py-2 font-mono-tactical text-[10px] font-bold uppercase text-primary"
                    >
                      Reiniciar Sistema
                    </button>
                  </div>
                </div>
              )}

              {scanFeedback && (
                <div className="absolute inset-x-0 bottom-32 z-30 flex justify-center px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center gap-3 rounded-2xl bg-success/90 px-6 py-3 text-white shadow-2xl backdrop-blur-xl"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">CAPTURA CONFIRMADA</div>
                      <div className="font-mono-tactical text-[8px] opacity-60">{scanFeedback}</div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Bottom Controls Area */}
              <div className="glass-panel-strong absolute inset-x-0 bottom-0 z-30 px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between">
                  {mode === "scan" ? (
                    <button
                      onClick={() => setManualOpen(true)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-primary transition-all active:scale-90"
                    >
                      <Keyboard className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="w-12" />
                  )}

                  <div className="relative">
                    <button
                      onClick={mode === "photo" ? handleCapture : toggleTorch}
                      className={`h-20 w-20 rounded-full border-4 ${mode === "photo" ? "border-white" : "border-primary/20"} flex items-center justify-center bg-transparent transition-all active:scale-95`}
                    >
                      <div className={`h-16 w-16 rounded-full ${mode === "photo" ? "bg-white" : torch ? "bg-primary shadow-glow-blue" : "bg-primary/20"} flex items-center justify-center`}>
                        {mode === "scan" && <Zap className={`h-6 w-6 ${torch ? "text-white" : "text-primary"}`} />}
                      </div>
                    </button>
                    {multiCapture && capturedCount > 0 && (
                      <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-black text-[10px] text-white">
                        {capturedCount}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-primary transition-all active:scale-90"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>

                {/* Finalize Button for Multi-Scan */}
                {multiScan && (onScan || multiCapture) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={onFinalize}
                      className="h-12 px-8 rounded-2xl bg-success text-black font-black text-[10px] shadow-glow-green uppercase tracking-widest border border-white/20 active:scale-95 transition-all"
                    >
                      FINALIZAR ({capturedCount || "CONCLUIR"})
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={handleGalleryUpload} 
            />
          </motion.div>

          {/* Portaled Modals (outside overflow-hidden) */}
          <ManualInputModal 
            open={manualOpen} 
            onClose={() => setManualOpen(false)} 
            onConfirm={handleManualSubmit} 
          />

          <TacticalSearchHUD 
            open={searchOpen} 
            onClose={() => setSearchOpen(false)} 
            onSelect={(sku) => {
              onScan?.(sku);
              setSearchOpen(false);
              if (!multiScan) onClose();
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};
