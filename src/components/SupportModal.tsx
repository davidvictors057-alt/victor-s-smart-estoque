import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Send, Bot, Phone, MessageSquare, History, ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export const SupportModal = ({ open, onClose }: SupportModalProps) => {
  const { currentUser, addTicket, tickets, fetchTickets, appSettings } = useStore();
  const { employeeTab, adminTab } = useApp();
  
  const [view, setView] = useState<"form" | "history" | "ai_response">("form");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "emergency">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTickets();
      setView("form");
      setSuccess(false);
    }
  }, [open, fetchTickets]);

  const currentContext = {
    screen: employeeTab === "profile" ? "Perfil" : employeeTab,
    adminTab: adminTab,
    timestamp: new Date().toISOString()
  };

  const handleAiConsult = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    
    // Simulação de resposta da IA (no futuro integrar com Gemini real)
    setTimeout(() => {
      setAiResponse(`Com base no Manual Victor's Celulares, para resolver '${message}', recomendo verificar o nível de bateria do dispositivo e o status do sistema na aba Central. Caso persista, gere um Ticket Urgente.`);
      setView("ai_response");
      setIsSubmitting(false);
    }, 1500);
  };

  const handleSubmitTicket = async () => {
    if (!message.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addTicket({
        user_id: currentUser.id,
        subject: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        description: message,
        priority: priority,
        context: currentContext
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting support ticket", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'low': return 'text-primary';
      case 'medium': return 'text-success';
      case 'high': return 'text-amber-500';
      case 'emergency': return 'text-danger';
      default: return 'text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'open': return <Clock className="h-3 w-3 text-primary" />;
      case 'in_progress': return <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />;
      case 'resolved': return <CheckCircle className="h-3 w-3 text-success" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-black-piano neon-blue-border relative w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,163,255,0.2)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-mono-tactical text-xs font-black uppercase tracking-[0.2em] text-white">
                    Suporte Tático
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-primary/60">Operação 24/7</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl bg-white/5 p-2 text-white/40 transition-all hover:bg-danger/20 hover:text-danger"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/5 px-4 py-2 bg-white/[0.02]">
              <button 
                onClick={() => setView("form")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest ${view === "form" ? "bg-primary/10 text-primary" : "text-white/40 hover:text-white"}`}
              >
                <MessageSquare className="h-3 w-3" /> NOVO CHAMADO
              </button>
              <button 
                onClick={() => setView("history")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest ${view === "history" ? "bg-primary/10 text-primary" : "text-white/40 hover:text-white"}`}
              >
                <History className="h-3 w-3" /> MEUS TICKETS
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 h-20 w-20 rounded-full bg-success/20 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-success/40">
                    <CheckCircle className="h-10 w-10 text-success" />
                  </div>
                  <h3 className="font-mono-tactical text-base font-black uppercase tracking-widest text-success">
                    OPERAÇÃO ENVIADA
                  </h3>
                  <p className="mt-3 text-xs text-white/50 max-w-[200px]">Ticket registrado com sucesso. Aguarde processamento.</p>
                </div>
              ) : view === "form" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-mono-tactical text-[9px] uppercase tracking-widest text-white/40 ml-1">Prioridade da Missão</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['low', 'medium', 'high', 'emergency'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${priority === p ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,163,255,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                        >
                          {p === 'low' && 'Baixa'}
                          {p === 'medium' && 'Média'}
                          {p === 'high' && 'Alta'}
                          {p === 'emergency' && 'Crítica'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono-tactical text-[9px] uppercase tracking-widest text-white/40 ml-1">Descrição do Incidente</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl bg-white/5 px-5 py-4 text-sm text-white border border-white/10 focus:border-primary focus:outline-none resize-none transition-all focus:bg-white/[0.08]"
                      placeholder="Relate o ocorrido com detalhes..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAiConsult}
                      disabled={isSubmitting || !message.trim()}
                      className="flex-1 rounded-2xl border border-primary/40 bg-primary/5 py-4 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Bot className="h-4 w-4" /> TRIAGEM IA
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitTicket}
                      disabled={isSubmitting || !message.trim()}
                      className="flex-[1.5] rounded-2xl bg-primary py-4 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-black hover:shadow-[0_0_20px_rgba(0,163,255,0.6)] transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "ENVIANDO..." : "GERAR TICKET"}
                      {!isSubmitting && <Send className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    {appSettings.support_whatsapp ? (
                      <motion.a 
                        initial={{ scale: 1 }}
                        animate={{ 
                          boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.4)", "0 0 0px rgba(239,68,68,0)"],
                          borderColor: ["rgba(239,68,68,0.2)", "rgba(239,68,68,1)", "rgba(239,68,68,0.2)"]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        href={`https://wa.me/${appSettings.support_whatsapp}?text=${encodeURIComponent("🚨 EMERGÊNCIA TÁTICA: Preciso de suporte imediato no Victor's Smart Estoque! 🚨")}`}
                        target="_blank"
                        className="flex items-center justify-between p-5 rounded-2xl bg-danger/10 border-[2px] border-danger/20 group hover:bg-danger/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative flex h-12 w-12 items-center justify-center">
                            <motion.div 
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="absolute inset-0 rounded-full bg-danger/20"
                            />
                            <div className="relative z-10 h-12 w-12 rounded-full bg-danger flex items-center justify-center text-black shadow-glow-red">
                              <Phone className="h-6 w-6" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-danger text-glow-red">LINHA VERMELHA</h4>
                            <p className="font-mono-tactical text-[8px] uppercase tracking-widest text-danger/60">CONTATO DIRETO DE EMERGÊNCIA</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <ChevronRight className="h-5 w-5 text-danger animate-pulse" />
                          <span className="font-mono-tactical text-[6px] font-black text-danger/40 animate-pulse">LIVE CONNECT</span>
                        </div>
                      </motion.a>
                    ) : (
                      <motion.button 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (useStore.getState().currentUser?.role === "admin") {
                            const { setScreen, setAdminTab, setProfileTab } = (window as any).appNavigation || {};
                            if (setScreen) {
                              setScreen("app");
                              setAdminTab("config");
                              onClose();
                            } else {
                              toast.info("Acesse: Painel Admin > Config");
                            }
                          } else {
                            toast.error("ACESSO NEGADO", { description: "Apenas administradores podem configurar a Linha Vermelha." });
                          }
                        }}
                        className="w-full p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center group hover:bg-white/[0.08] hover:border-primary/50 transition-all cursor-pointer"
                      >
                        <AlertTriangle className="h-8 w-8 text-white/10 mx-auto mb-3 group-hover:text-amber-500 transition-colors" />
                        <h4 className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">Linha Vermelha Inativa</h4>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1 group-hover:text-white/60">Clique para configurar no Painel Admin &gt; Configurações</p>
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : view === "history" ? (
                <div className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                      <History className="h-12 w-12 mb-3" />
                      <p className="text-[10px] uppercase tracking-widest">Sem tickets anteriores</p>
                    </div>
                  ) : (
                    tickets.filter(t => t.user_id === currentUser?.id).map((t) => (
                      <div key={t.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${getPriorityColor(t.priority)}`}>
                            {t.priority}
                          </span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold">
                            {getStatusIcon(t.status)}
                            <span className="uppercase tracking-widest">{t.status}</span>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{t.subject}</h4>
                        <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">{t.description}</p>
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] text-white/20 uppercase tracking-widest">
                          <span>{new Date(t.created_at).toLocaleDateString()}</span>
                          <button className="text-primary/60 hover:text-primary transition-colors">VER DETALHES</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <Bot className="h-5 w-5" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Diagnóstico Victor AI</h4>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed italic">
                      "{aiResponse}"
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => setView("form")}
                      className="w-full py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
                    >
                      NÃO RESOLVEU, VOLTAR AO FORMULÁRIO
                    </button>
                    <button 
                      onClick={handleSubmitTicket}
                      className="w-full py-4 rounded-2xl bg-primary text-[10px] font-black uppercase tracking-widest text-black hover:shadow-[0_0_20px_rgba(0,163,255,0.6)] transition-all"
                    >
                      GERAR TICKET AGORA
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white/5 px-8 py-4 flex justify-center">
               <div className="font-mono-tactical text-[8px] uppercase tracking-[0.3em] text-white/20">
                Victor's Smart Estoque · v2.0
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
