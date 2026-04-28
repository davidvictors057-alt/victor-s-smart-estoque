import { motion, AnimatePresence } from "framer-motion";
import { X, History, ArrowUpRight, ArrowDownLeft, User, Clock, Search } from "lucide-react";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface ActivityLogsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ActivityLogsModal = ({ open, onClose }: ActivityLogsModalProps) => {
  const { movements } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMovements = movements
    .filter(m => 
      m.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.operator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 50);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-20 z-[70] mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] bg-black-piano neon-blue-border shadow-[0_0_50px_rgba(0,163,255,0.3)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                    SISTEMA DE AUDITORIA
                  </h3>
                  <p className="text-xl font-black text-white">Logs de Atividade</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Filtrar por produto ou operador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Logs List */}
            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar space-y-3">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group relative flex items-center justify-between gap-4 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/5 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        m.type === 'in' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                      }`}>
                        {m.type === 'in' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                          {m.product?.name || "Produto Desconhecido"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-3 w-3 text-white/30" />
                          <span className="text-[10px] text-white/40 uppercase font-mono-tactical tracking-widest truncate">
                            {m.operator?.full_name || "Sistema"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${
                        m.type === 'in' ? 'text-success' : 'text-danger'
                      }`}>
                        {m.type === 'in' ? "+ ENTRADA" : "- SAÍDA"}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end mt-1 text-white/20">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-mono-tactical">
                          {format(new Date(m.timestamp), "HH:mm · dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <History className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-mono-tactical text-xs uppercase tracking-widest">Nenhum log encontrado</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white/[0.02] p-6 text-center border-t border-white/5">
              <p className="text-[10px] text-white/20 font-mono-tactical uppercase tracking-[0.2em]">
                Auditoria em tempo real via Supabase Crypt
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
