import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, Search, Filter, Calendar as CalendarIcon, X, Clock, CheckCircle2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";

export const MovementsView = () => {
  const { movements, fetchMovements } = useStore();
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | Date>("all");
  const [showDateMenu, setShowDateMenu] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const moves = movements.map(m => {
    const d = new Date(m.timestamp);
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    return {
      ...m,
      time: timeStr,
      date: dateStr,
      action: m.type,
      productName: m.product ? `${m.product.name} ${m.product.spec ? `· ${m.product.spec}` : ''}` : "Item Sincronizado",
      displayImei: m.product?.imei || m.product?.sku || "N/A",
      operatorName: m.operator?.full_name || "Sistema",
      rawDate: d
    };
  });

  const filtered = moves.filter((m) => {
    const matchesFilter = filter === "all" || m.action === filter;
    const matchesQuery = query === "" || 
      m.productName.toLowerCase().includes(query.toLowerCase()) || 
      m.displayImei.toLowerCase().includes(query.toLowerCase()) ||
      m.operatorName.toLowerCase().includes(query.toLowerCase());
    
    const matchesDate = () => {
      if (dateFilter === "all") return true;
      const today = new Date();
      const itemDate = new Date(m.timestamp);
      
      if (dateFilter instanceof Date) {
        return itemDate.toDateString() === dateFilter.toDateString();
      }

      if (dateFilter === "today") return itemDate.toDateString() === today.toDateString();
      if (dateFilter === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return itemDate.toDateString() === yesterday.toDateString();
      }
      return true;
    };

    return matchesFilter && matchesQuery && matchesDate();
  });

  return (
    <div className="space-y-4 px-3 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="bg-black-piano neon-blue-border-thin group relative flex w-full items-center rounded-2xl px-4 py-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all focus-within:neon-blue-border">
          <Search className="mr-3 h-5 w-5 text-white transition-colors group-focus-within:text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, IMEI ou operador..."
            className="w-full bg-transparent font-mono-tactical text-sm font-black text-white placeholder-white/20 outline-none"
          />
          <div className="ml-4 flex items-center gap-3">
            <button 
              onClick={() => {
                setQuery("");
                setFilter("all");
                setDateFilter("all");
                toast.info("Filtros resetados");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white transition-all hover:bg-danger hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowDateMenu(!showDateMenu)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${dateFilter !== "all" ? "bg-primary text-black" : "bg-white/5 text-white hover:bg-primary/20"}`}
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
              
              {showDateMenu && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-3xl bg-black-piano border-2 border-primary/20 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-2">
                    {(["all", "today", "yesterday"] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDateFilter(d);
                          setShowDateMenu(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === d ? "bg-primary text-black shadow-glow-cyan" : "text-white hover:bg-white/5"}`}
                      >
                        <Clock className="h-4 w-4" />
                        {d === "all" ? "Tudo" : d === "today" ? "Hoje" : "Ontem"}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <div className="mb-2 px-1 font-mono-tactical text-[9px] font-black text-primary uppercase tracking-widest">Busca por Data</div>
                    <div className="rounded-2xl bg-white/[0.02] p-1 ring-1 ring-white/10">
                      <Calendar
                        mode="single"
                        selected={dateFilter instanceof Date ? dateFilter : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setDateFilter(date);
                            setShowDateMenu(false);
                          }
                        }}
                        className="bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black-piano neon-blue-border-thin flex items-center gap-1.5 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          {(["all", "in", "out"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 rounded-xl px-3 py-2 font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                filter === k
                  ? k === "in"
                    ? "bg-success text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105"
                    : k === "out"
                      ? "bg-danger text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105"
                      : "bg-primary text-black shadow-[0_0_20px_rgba(0,163,255,0.6)] scale-105"
                  : "text-white hover:bg-white/5 hover:text-white"
              }`}
            >
              {k === "all" ? "Todos" : k === "in" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black-piano neon-blue-border space-y-2 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      >
        {filtered.length === 0 ? (
          <div className="py-20 text-center font-mono-tactical text-[11px] font-black uppercase tracking-[0.3em] text-white">
            Nenhuma movimentação encontrada
          </div>
        ) : (
          filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.03, x: 10, y: -2 }}
              className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-5 transition-all hover:bg-white/[0.05] hover:neon-blue-border shadow-none hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:rotate-6 ${
                  m.action === "in"
                    ? "bg-success/20 text-success border border-success/40 shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:bg-success group-hover:text-black group-hover:shadow-[0_0_40px_rgba(34,197,94,0.9)]"
                    : "bg-danger/20 text-danger border border-danger/40 shadow-[0_0_20px_rgba(239,68,68,0.3)] group-hover:bg-danger group-hover:text-white group-hover:shadow-[0_0_40px_rgba(239,68,68,0.9)]"
                }`}
              >
                {m.action === "in" ? <ArrowDownToLine className="h-7 w-7" /> : <ArrowUpFromLine className="h-7 w-7" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight">{m.productName}</span>
                  <span className="font-mono-tactical text-[13px] font-black text-white group-hover:text-white">{m.time}</span>
                </div>
                {m.notes && (
                  <div className="font-mono-tactical text-[10px] font-bold text-primary/70 uppercase tracking-[0.1em] mb-1">
                    {m.notes}
                  </div>
                )}
                <div className="font-mono-tactical mt-2 flex flex-wrap items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-white group-hover:text-white">
                  <span className="bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 group-hover:border-primary/50 group-hover:text-white transition-all">ID {m.displayImei}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-primary/50 transition-all"></span>
                  <span className="text-primary group-hover:text-primary-glow font-black">{m.operatorName}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-primary/50 transition-all"></span>
                  <span className={`group-hover:text-white ${m.date === new Date().toLocaleDateString('pt-BR') ? "text-primary/60" : ""}`}>
                    {m.date === new Date().toLocaleDateString('pt-BR') ? "HOJE" : 
                     m.date === new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('pt-BR') ? "ONTEM" : m.date}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.section>
    </div>
  );
};
