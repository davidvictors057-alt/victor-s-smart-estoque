import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Delete, Lock, ShieldCheck, Fingerprint } from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ChangePinModalProps {
  open: boolean;
  onClose: () => void;
}

const PIN_LENGTH = 6;

export const ChangePinModal = ({ open, onClose }: ChangePinModalProps) => {
  const { currentUser, updateProfile } = useStore();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"new" | "confirm">("new");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setPin("");
      setConfirmPin("");
      setStep("new");
      setError(false);
    }
  }, [open]);

  const handlePress = (v: string) => {
    if (updating) return;
    setError(false);

    if (v === "back") {
      if (step === "new") setPin(p => p.slice(0, -1));
      else setConfirmPin(p => p.slice(0, -1));
      return;
    }

    if (step === "new") {
      if (pin.length < PIN_LENGTH) setPin(p => p + v);
    } else {
      if (confirmPin.length < PIN_LENGTH) setConfirmPin(p => p + v);
    }
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH && step === "new") {
      setTimeout(() => setStep("confirm"), 300);
    }
  }, [pin, step]);

  useEffect(() => {
    if (confirmPin.length === PIN_LENGTH && step === "confirm") {
      if (pin === confirmPin) {
        handleUpdate();
      } else {
        toast.error("Os PINs não conferem!");
        setError(true);
        setConfirmPin("");
      }
    }
  }, [confirmPin, step, pin]);

  const handleUpdate = async () => {
    if (!currentUser) return;
    setUpdating(true);
    
    try {
      // 1. Update Supabase Auth Password
      const { error: authError } = await supabase.auth.updateUser({
        password: pin
      });

      if (authError) throw authError;

      // 2. Update Profiles Table
      await updateProfile(currentUser.id, { pin: pin });

      toast.success("PIN Atualizado!", {
        description: "Sua credencial tática foi sincronizada."
      });
      
      setTimeout(onClose, 500);
    } catch (err: any) {
      toast.error("Falha na atualização", {
        description: err.message
      });
      setPin("");
      setConfirmPin("");
      setStep("new");
    } finally {
      setUpdating(false);
    }
  };

  const currentVal = step === "new" ? pin : confirmPin;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-black-piano neon-blue-border relative w-full max-w-[380px] overflow-hidden rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(0,163,255,0.2)]"
          >
            {/* Background Decorations */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            
            <div className="relative flex flex-col items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-inner">
                {step === "new" ? (
                  <Lock className="h-8 w-8 text-primary shadow-glow-cyan" />
                ) : (
                  <ShieldCheck className="h-8 w-8 text-success shadow-glow-success animate-pulse" />
                )}
              </div>

              <div className="text-center">
                <h3 className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary">
                  SEGURANÇA TÁTICA
                </h3>
                <h2 className="mt-1 text-xl font-black text-white">
                  {step === "new" ? "Novo PIN de Acesso" : "Confirme seu PIN"}
                </h2>
                <p className="mt-2 text-[10px] font-bold text-white uppercase tracking-widest">
                  {updating ? "SINCRONIZANDO CRIPTOGRAFIA..." : "DIGITE 6 DÍGITOS NUMÉRICOS"}
                </p>
              </div>

              {/* PIN Display */}
              <div className="flex gap-2">
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex h-12 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
                      i < currentVal.length
                        ? step === "confirm" ? "border-success bg-success/10 text-success shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,163,255,0.3)]"
                        : "border-white/5 bg-white/5"
                    }`}
                  >
                    {i < currentVal.length ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`h-2 w-2 rounded-full ${step === "confirm" ? "bg-success shadow-glow-success" : "bg-primary shadow-glow-cyan"}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid w-full grid-cols-3 gap-3 pt-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "back"].map((k, i) => {
                  const isBack = k === "back";
                  const isZero = k === "0";
                  
                  return (
                    <motion.button
                      key={k}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handlePress(k)}
                      className={`flex h-14 items-center justify-center rounded-2xl bg-white/5 text-xl font-black text-white ring-1 ring-white/10 transition-all hover:bg-white/10 active:bg-primary/20 active:text-primary active:ring-primary/40 ${
                        isBack ? "col-span-1 text-danger/60" : isZero ? "col-span-2" : ""
                      }`}
                    >
                      {isBack ? <Delete className="h-6 w-6" /> : k}
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                disabled={updating}
                className="mt-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-danger transition-colors"
              >
                Cancelar Operação
              </button>
            </div>

            {/* Tactical Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-xl p-2 text-white hover:bg-white/5 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
