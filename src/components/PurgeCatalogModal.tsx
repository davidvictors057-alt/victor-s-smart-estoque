import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Lock, ShieldAlert, CheckCircle2, Database } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

interface PurgeCatalogModalProps {
  open: boolean;
  onClose: () => void;
}

export const PurgeCatalogModal = ({ open, onClose }: PurgeCatalogModalProps) => {
  const { currentUser, purgeCatalog } = useStore();
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
      toast.error("PIN INCORRETO", { description: "Acesso ao protocolo de catálogo negado." });
      setPin("");
    }
  };

  const handleFinalConfirm = async () => {
    if (pin === currentUser?.pin) {
      setIsProcessing(true);
      try {
        await purgeCatalog();
        toast.success("CATÁLOGO EXPURGADO", { description: "Toda a inteligência de SKUs foi zerada." });
        handleClose();
      } catch (err) {
        toast.error("FALHA NO PROTOCOLO", { description: "Erro ao limpar catálogo." });
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast.error("PIN FINAL INCORRETO", { description: "Operação abortada." });
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
            className="fixed inset-x-4 top-[15%] z-[90] mx-auto max-w-md overflow-hidden rounded-[2.5rem] bg-black-piano neon-blue-border shadow-[0_0_80px_rgba(0,243,255,0.2)]"
          >
            {/* Header */}
            <div className="bg-primary/10 border-b border-primary/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary animate-pulse" />
                <div>
                  <h3 className="font-mono-tactical text-[9px] font-black uppercase tracking-[0.4em] text-primary">DADOS E INTELIGÊNCIA</h3>
                  <p className="text-sm font-black text-white uppercase tracking-tighter">Limpar Catálogo de SKUs</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/20 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <Lock className="h-12 w-12 text-primary/40 mx-auto mb-4" />
                    <p className="text-white/60 text-sm">Confirme seu PIN de administrador para gerenciar o catálogo.</p>
                  </div>
                  <div className="space-y-2">
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
                    AVANÇAR PROTOCOLO
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-primary/10 rounded-2xl p-6 border border-primary/30 space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                      <AlertTriangle className="h-6 w-6 shrink-0" />
                      <span className="font-black text-xs uppercase tracking-widest">AVISO DE LIMPEZA</span>
                    </div>
                    <ul className="text-[11px] text-white/70 space-y-2 font-bold uppercase">
                      <li>• Nomes personalizados serão deletados</li>
                      <li>• Referências de fotos premium removidas</li>
                      <li>• Histórico de custos/vendas zerado</li>
                      <li>• <span className="text-success">Preservados:</span> Produtos em estoque e Movimentações</li>
                      <li>• O sistema voltará a usar IA pura no início</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-primary text-black py-4 rounded-2xl font-mono-tactical font-black uppercase tracking-widest shadow-glow-cyan"
                  >
                    CONTINUAR PARA CONFIRMAÇÃO
                  </button>
                  <button onClick={handleClose} className="w-full text-white/40 text-[10px] font-mono-tactical uppercase tracking-widest py-2">
                    ABORTAR
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
                    <p className="text-primary font-black text-sm uppercase">VALIDAÇÃO FINAL</p>
                    <p className="text-white/40 text-[10px] uppercase font-mono-tactical">Digite seu PIN pela última vez para confirmar a limpeza do catálogo.</p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-primary/5 border border-primary/30 py-5 text-white focus:border-primary focus:outline-none transition-all"
                      placeholder="••••••"
                    />
                  </div>
                  <button
                    disabled={isProcessing}
                    onClick={handleFinalConfirm}
                    className="w-full bg-primary text-black py-4 rounded-2xl font-mono-tactical font-black uppercase tracking-widest shadow-glow-cyan disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <span className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        EXECUTAR LIMPEZA
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Tactical Footer */}
            <div className="bg-black/40 p-4 text-center border-t border-white/5">
              <p className="text-[8px] text-white/20 font-mono-tactical uppercase tracking-[0.3em]">
                Catalog Purge Protocol v1.0 · Admin Override Required
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
