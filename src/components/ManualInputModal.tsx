import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ManualInputModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
}

export const ManualInputModal = ({ open, onClose, onConfirm }: ManualInputModalProps) => {
  const [manualCode, setManualCode] = useState("");

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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
        >
          <motion.form 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onSubmit={handleSubmit}
            className="bg-black-piano neon-blue-border w-full max-w-sm rounded-[2.5rem] p-10 shadow-[0_0_80px_rgba(0,163,255,0.3)]"
          >
            <div className="mb-8 text-center">
              <div className="font-mono-tactical mb-2 text-[12px] font-black uppercase tracking-[0.5em] text-primary">
                SISTEMA OPERACIONAL
              </div>
              <div className="text-xl font-black text-white tracking-tight">ENTRADA MANUAL</div>
              <div className="mt-2 text-xs text-white font-mono-tactical tracking-widest">DIGITE BARCODE / QR / INTERNO</div>
            </div>
            
            <div className="group mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all focus-within:border-primary focus-within:bg-white/[0.07] focus-within:shadow-[0_0_30px_rgba(0,163,255,0.15)]">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="000000"
                className="font-mono-tactical w-full bg-transparent text-center text-4xl font-black tracking-[0.3em] text-primary outline-none placeholder:text-white"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-white/5 py-4 text-xs font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-primary py-4 text-xs font-black text-black shadow-[0_0_30px_rgba(0,163,255,0.5)] hover:shadow-[0_0_45px_rgba(0,163,255,0.7)] transition-all uppercase tracking-widest"
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
