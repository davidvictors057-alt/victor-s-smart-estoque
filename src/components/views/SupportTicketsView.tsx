import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Clock, CheckCircle, AlertTriangle, MessageSquare, User, Smartphone, Calendar, ChevronRight, MessageCircle } from "lucide-react";
import { useStore, SupportTicket } from "@/store/useStore";

export const SupportTicketsView = () => {
  const { tickets, fetchTickets, updateTicket } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await updateTicket(id, { status });
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'emergency': return <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[9px] font-black uppercase tracking-widest border border-danger/30">Crítico</span>;
      case 'high': return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/30">Alta</span>;
      default: return <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/30">{priority}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <h2 className="font-mono-tactical text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <MessageCircle className="h-4 w-4" /> Gestão de Suporte Tático
        </h2>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === f ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white border-white/10'}`}
            >
              {f === 'all' ? 'Todos' : f === 'open' ? 'Abertos' : f === 'in_progress' ? 'Em Progresso' : 'Resolvidos'}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white" />
          <input
            type="text"
            placeholder="Buscar por ticket ou funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <motion.div
            layout
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            className={`bg-black-piano border rounded-[2rem] p-6 transition-all cursor-pointer group ${selectedTicket?.id === ticket.id ? 'border-primary shadow-[0_0_30px_rgba(0,163,255,0.2)]' : 'border-white/10 hover:border-white/20'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                  {ticket.user?.avatar_url ? (
                    <img src={ticket.user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{ticket.user?.full_name || 'Usuário Desconhecido'}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white uppercase tracking-widest mt-0.5">
                    <Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              {getPriorityBadge(ticket.priority)}
            </div>

            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">{ticket.subject}</h4>
            <p className="text-xs text-white leading-relaxed mb-4 line-clamp-2">{ticket.description}</p>

            {selectedTicket?.id === ticket.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pt-4 border-t border-white/5 mt-4 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white mb-1 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> Contexto
                    </p>
                    <p className="text-[10px] text-white font-bold">{String(ticket.context?.screen || 'N/A')}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Status
                    </p>
                    <p className="text-[10px] text-white font-bold uppercase tracking-widest">{ticket.status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'in_progress'); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'}`}
                  >
                    Atender
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'resolved'); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ticket.status === 'resolved' ? 'bg-success text-black' : 'bg-success/10 text-success border border-success/30'}`}
                  >
                    Resolver
                  </button>
                </div>
              </motion.div>
            )}

            {!selectedTicket || selectedTicket.id !== ticket.id ? (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-primary uppercase font-bold tracking-widest">Clique para ver detalhes</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            ) : null}
          </motion.div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="font-mono-tactical text-xs uppercase tracking-widest">Nenhum ticket encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};
