import { useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ManualInputModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
}

export const ManualInputModal = ({ open, onClose, onConfirm }: ManualInputModalProps) => {
  const [manualCode, setManualCode] = useState("");

  // Ultra-aggressive viewport lockdown
  useLayoutEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        const top = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(top || '0') * -1);
      };
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onConfirm(manualCode);
    setManualCode("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center bg-black/90 backdrop-blur-xl p-6 pt-[10vh] overflow-y-auto"
          style={{ paddingBottom: '80vh' }}
        >
          <motion.form 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onSubmit={handleSubmit}
            className="bg-black-piano border border-primary/30 w-full max-w-sm rounded-[3rem] p-8 shadow-[0_0_100px_rgba(0,163,255,0.3)] shrink-0"
          >
            <div className="mb-8 text-center">
              <div className="font-mono-tactical mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                SISTEMA OPERACIONAL
              </div>
              <div className="text-xl font-black text-white tracking-tight italic uppercase">ENTRADA MANUAL</div>
            </div>
            
            <div className="group mb-10 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 transition-all focus-within:border-primary focus-within:bg-white/[0.07] focus-within:shadow-[0_0_40px_rgba(0,163,255,0.2)]">
              <input
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="DIGITAR..."
                className="font-mono-tactical w-full bg-transparent text-center text-3xl font-black tracking-[0.2em] text-primary outline-none placeholder:text-white/10 uppercase"
                inputMode="text"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-16 rounded-2xl bg-white/5 text-[10px] font-black text-white/40 hover:bg-white/10 transition-all uppercase tracking-widest border border-white/5"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="flex-1 h-16 rounded-2xl bg-primary text-[10px] font-black text-black shadow-glow-cyan hover:scale-105 transition-all uppercase tracking-widest"
              >
                CONFIRMAR
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
