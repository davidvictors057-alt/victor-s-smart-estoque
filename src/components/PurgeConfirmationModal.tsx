import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

interface PurgeConfirmationModalProps {
  open: boolean;
  onClose: () => void;
}

export const PurgeConfirmationModal = ({ open, onClose }: PurgeConfirmationModalProps) => {
  const { currentUser, purgeSystem } = useStore();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetModal = () => {
    setStep(1);
    setPin("");
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFirstPin = () => {
    if (pin === currentUser?.pin) {
      setStep(2);
      setPin("");
    } else {
      toast.error("PIN INCORRETO", { description: "Acesso ao protocolo negado." });
      setPin("");
    }
  };

  const handleFinalConfirm = async () => {
    if (pin === currentUser?.pin) {
      setIsProcessing(true);
      try {
        await purgeSystem();
        toast.success("SISTEMA RESETADO", { description: "O protocolo de purga foi concluído com sucesso." });
        handleClose();
      } catch (err) {
        toast.error("FALHA NO PROTOCOLO", { description: "Ocorreu um erro durante a purga." });
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast.error("PIN FINAL INCORRETO", { description: "Protocolo de purga abortado por segurança." });
      setPin("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed inset-x-4 top-[15%] z-[90] mx-auto max-w-md overflow-hidden rounded-[2.5rem] bg-black-piano neon-red-border shadow-[0_0_80px_rgba(239,68,68,0.4)]"
          >
            {/* Header */}
            <div className="bg-danger/10 border-b border-danger/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-danger animate-pulse" />
                <div>
                  <h3 className="font-mono-tactical text-[9px] font-black uppercase tracking-[0.4em] text-danger">PROTOCOLO DE SEGURANÇA</h3>
                  <p className="text-sm font-black text-white uppercase tracking-tighter">Limpeza Total do Sistema</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <Lock className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-white text-sm">Para iniciar o protocolo, confirme sua identidade de desenvolvedor.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono-tactical text-[9px] uppercase tracking-widest text-white ml-1">DIGITE SEU PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-white/5 border border-white/10 py-5 text-white focus:border-primary focus:outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                  <button
                    onClick={handleFirstPin}
                    className="w-full bg-primary text-black py-4 rounded-2xl font-mono-tactical font-black uppercase tracking-widest shadow-glow-cyan"
                  >
                    INICIAR PROTOCOLO
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-danger/10 rounded-2xl p-6 border border-danger/30 space-y-4">
                    <div className="flex items-center gap-3 text-danger">
                      <AlertTriangle className="h-6 w-6 shrink-0" />
                      <span className="font-black text-xs uppercase tracking-widest">AVISO CRÍTICO</span>
                    </div>
                    <ul className="text-[11px] text-danger/80 space-y-2 font-bold uppercase">
                      <li>• Todos os movimentos serão deletados</li>
                      <li>• Estoque de produtos será zerado</li>
                      <li>• Notificações e Tickets removidos</li>
                      <li>• <span className="text-white">Preservados:</span> Usuários, PINs e Alma da IA</li>
                      <li>• ESTA AÇÃO É IRREVERSÍVEL PARA OS DADOS</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-danger text-white py-4 rounded-2xl font-mono-tactical font-black uppercase tracking-widest shadow-glow-red hover:bg-danger/80 transition-all"
                  >
                    ESTOU CIENTE E DESEJO CONTINUAR
                  </button>
                  <button onClick={handleClose} className="w-full text-white text-[10px] font-mono-tactical uppercase tracking-widest py-2">
                    CANCELAR OPERAÇÃO
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <ShieldAlert className="h-12 w-12 text-danger mx-auto mb-4 animate-bounce" />
                    <p className="text-danger font-black text-sm uppercase">CONFIRMAÇÃO FINAL EXIGIDA</p>
                    <p className="text-white text-[10px] uppercase font-mono-tactical">Digite seu PIN uma última vez para confirmar a purga do banco de dados.</p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-danger/5 border border-danger/30 py-5 text-white focus:border-danger focus:outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                  <button
                    disabled={isProcessing}
                    onClick={handleFinalConfirm}
                    className="w-full bg-danger text-white py-4 rounded-2xl font-mono-tactical font-black uppercase tracking-widest shadow-glow-red disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        EXECUTAR PURGA TOTAL
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Tactical Footer */}
            <div className="bg-black/40 p-4 text-center border-t border-white/5">
              <p className="text-[8px] text-white font-mono-tactical uppercase tracking-[0.3em]">
                Secure Purge Protocol v2.4 · Access Level: Developer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
