import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  ArrowLeftRight,
  Sparkles,
  AlertTriangle,
  Activity,
  Target,
  Zap,
  LayoutDashboard,
  Check,
  Camera,
  Info,
} from "lucide-react";
import { CameraView } from "./CameraView";

import { useStore } from "@/store/useStore";

const cascade = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
});

export const AdminCockpit = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const { 
    products, 
    movements, 
    updateProduct, 
    fetchAll, 
    getChartData,
    lastAiAnalysis,
    isAiLoading,
    onlineBrainMode,
    runPredictiveAnalysis
  } = useStore();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tooltipMetric, setTooltipMetric] = useState<string | null>(null);

  const chartData = getChartData();

  const metricExplanations: Record<string, { title: string, body: string }> = {
    "Margem bruta": {
      title: "Margem Bruta (Lucratividade)",
      body: "Representa a porcentagem que sobra de cada venda após pagar o custo do produto. Uma margem alta indica que seu lucro operacional é saudável."
    },
    "Ticket médio": {
      title: "Ticket Médio (Faturamento)",
      body: "É o valor médio de cada venda. Aumentar o ticket médio significa que seus clientes estão comprando itens mais caros ou mais itens por vez."
    },
    "Giro médio": {
      title: "Giro de Estoque (Eficiência)",
      body: "Indica quantas vezes seu estoque 'rodou' (foi vendido e reposto). Um giro alto significa que o seu dinheiro não está parado na prateleira."
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  // Calculate Radar Data from real products (ONLY IN STOCK)
  const inStockProducts = products.filter(p => p.status === 'in_stock');
  
  const brandCounts = inStockProducts.reduce((acc: Record<string, number>, p) => {
    const brand = p.brand || "Outros";
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const radarData = Object.entries(brandCounts)
    .map(([brand, units]) => ({ brand, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);
  
  // Total value in stock (ONLY IN STOCK)
  const totalPatrimony = inStockProducts.reduce((sum, p) => sum + (p.cost || 0), 0);
  const formattedPatrimony = totalPatrimony.toLocaleString("pt-BR");
  const [, cents] = totalPatrimony.toFixed(2).split(".");

  // Daily movements (TODAY & YESTERDAY)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todayProcessed = movements.filter(m => m.timestamp?.startsWith(todayStr) && m.type === 'in');
  const yesterdayProcessed = movements.filter(m => m.timestamp?.startsWith(yesterdayStr) && m.type === 'in');

  const growth = yesterdayProcessed.length > 0 
    ? ((todayProcessed.length - yesterdayProcessed.length) / yesterdayProcessed.length) * 100 
    : 0;

  const integrity = products.length > 0 ? (inStockProducts.length / products.length) * 100 : 0;

  // 📊 CALCULATED METRICS
  const salesMovements = movements.filter(m => m.type === 'out');
  const totalRevenue = salesMovements.reduce((sum, m) => sum + (m.product?.sale || 0), 0);
  const totalCostOfSold = salesMovements.reduce((sum, m) => sum + (m.product?.cost || 0), 0);
  
  const ticketMedio = salesMovements.length > 0 ? totalRevenue / salesMovements.length : 0;
  const margemBruta = totalRevenue > 0 ? ((totalRevenue - totalCostOfSold) / totalRevenue) * 100 : 0;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const recentSalesCount = salesMovements.filter(m => new Date(m.timestamp) > thirtyDaysAgo).length;
  const inStockCount = inStockProducts.length;
  const giroMedio = inStockCount > 0 ? recentSalesCount / inStockCount : 0;

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-24">
      {/* Header Cockpit - Enhanced Floating Effect */}
      <motion.header
        {...cascade(0)}
        whileHover={{ scale: 1.01, y: -2 }}
        className="bg-black-piano neon-blue-border flex items-center justify-between rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,163,255,0.2)]"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black shadow-[0_0_25px_rgba(0,163,255,0.8)]">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <div>
            <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.5em] text-primary">
              ADMIN COCKPIT
            </div>
            <div className="text-2xl font-black text-white tracking-tighter">Terminal de Comando</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <ArrowLeftRight className="h-5 w-5 rotate-90" />
          </button>
          <div className="font-mono-tactical text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/20">Sync Status</div>
            <div className="text-sm font-black text-success text-glow-success flex items-center gap-2 justify-end">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              LIVE · {integrity.toFixed(1)}%
            </div>
          </div>
        </div>
      </motion.header>

      {/* HERO KPI: Total stock value */}
      <motion.section
        {...cascade(1)}
        whileHover={{ y: -4 }}
        className={`bg-black-piano neon-blue-border relative !overflow-visible rounded-[2.5rem] p-6 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.9)] transition-all duration-300 ${tooltipMetric ? 'z-[60]' : 'z-10'}`}
      >
        {/* Background Effects Wrapper (to keep glow contained) */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute inset-0 tactical-grid opacity-20" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.5em] text-primary/70">
                PATRIMÔNIO EM OPERAÇÃO
              </div>
              <div className="font-mono-tactical mt-5 text-5xl font-black text-white text-glow-cyan sm:text-6xl">
                R$ {formattedPatrimony}<span className="text-2xl text-white/20">,{cents}</span>
              </div>
              {formattedPatrimony !== "0" && (
                <div className="mt-6 flex items-center gap-4">
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-1.5 ring-2 shadow-2xl ${growth > 0 ? 'bg-success/20 ring-success/50 text-success shadow-success/20' : growth < 0 ? 'bg-danger/20 ring-danger/50 text-danger shadow-danger/20' : 'bg-white/5 ring-white/10 text-white/30 shadow-none'}`}>
                    {growth > 0 ? <TrendingUp className="h-4 w-4" /> : growth < 0 ? <TrendingDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    <span className="font-mono-tactical text-xs font-black">{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
                  </div>
                  <span className="font-mono-tactical text-[11px] font-black uppercase tracking-widest text-white/30">
                    INDICADOR DE CRESCIMENTO
                  </span>
                </div>
              )}
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-2xl backdrop-blur-md">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-white/5 pt-8">
            {[
              { 
                label: "Margem bruta", 
                value: `${margemBruta.toFixed(1)}%`, 
                trend: margemBruta > 25 ? "up" : "down" 
              },
              { 
                label: "Ticket médio", 
                value: `R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, 
                trend: ticketMedio > 500 ? "up" : "down" 
              },
              { 
                label: "Giro médio", 
                value: `${giroMedio.toFixed(1)}x`, 
                trend: giroMedio > 1 ? "up" : "down" 
              },
            ].map((s) => (
              <div key={s.label} className="min-w-0 relative group">
                <div className="flex items-center gap-1.5">
                  <div className="font-mono-tactical text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/20 truncate">
                    {s.label}
                  </div>
                  <button 
                    onClick={() => setTooltipMetric(s.label === tooltipMetric ? null : s.label)}
                    className="text-white/10 hover:text-primary transition-colors"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </div>
                <div className="font-mono-tactical mt-1.5 flex items-center gap-1.5 text-base sm:text-lg font-black text-white truncate">
                  {s.value}
                  {s.trend === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-danger" />
                  )}
                </div>

                <AnimatePresence>
                  {tooltipMetric === s.label && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute z-[100] top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-black/80 border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                    >
                      {/* Arrow/Pointer */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-l border-t border-white/10 rotate-45" />
                      
                      <div className="font-mono-tactical text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        {metricExplanations[s.label].title}
                      </div>
                      <div className="text-[11px] leading-relaxed text-white/70 font-medium">
                        {metricExplanations[s.label].body}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
      
      {/* 🧠 AI PREDICTIVE ANALYSIS SECTION */}
      <motion.section
        {...cascade(1.2)}
        className="bg-black-piano neon-purple-border rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-ai/10 blur-[80px]" />
        
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai/20 text-ai ring-1 ring-ai/50 animate-pulse-ai">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-ai/70">INTELIGÊNCIA ARTIFICIAL</div>
              <div className="text-lg font-black text-white">Análise Preditiva</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="font-mono-tactical text-right mr-2">
                <div className="text-[8px] uppercase tracking-widest text-white/20">Cérebro</div>
                <div className={`text-[10px] font-black ${onlineBrainMode ? 'text-ai' : 'text-white/40'}`}>
                   {onlineBrainMode ? 'ONLINE' : 'OFFLINE'}
                </div>
             </div>

             {!lastAiAnalysis && (
                <button
                  onClick={runPredictiveAnalysis}
                  disabled={isAiLoading}
                  className="bg-ai text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:neon-purple-border transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  {isAiLoading ? 'Processando...' : 'Ativar Cérebro'}
                </button>
             )}
          </div>
        </div>

        {lastAiAnalysis && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
           >
              {lastAiAnalysis.split('\n').filter(l => l.trim() && (l.includes('-') || l.length > 5)).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 group hover:border-ai/30 transition-all backdrop-blur-sm shadow-xl">
                   <div className="h-8 w-8 rounded-lg bg-ai/10 flex items-center justify-center text-ai shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="h-4 w-4" />
                   </div>
                   <p className="text-[13px] text-white/80 font-medium leading-relaxed italic">
                      "{insight.replace(/^-\s*/, '').replace(/^[0-9]\.\s*/, '')}"
                   </p>
                </div>
              ))}
              
              <button 
                onClick={runPredictiveAnalysis}
                disabled={isAiLoading}
                className="col-span-full mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-ai transition-all flex items-center justify-center gap-3 py-3 border-t border-white/5"
              >
                {isAiLoading ? <Activity className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                {isAiLoading ? 'RECALCULANDO PADRÕES...' : 'RECALCULAR INSIGHTS ESTRATÉGICOS'}
              </button>
           </motion.div>
        )}
      </motion.section>

      {/* 📊 WEEKLY MOVEMENT CHART */}
      <motion.section
        {...cascade(1.5)}
        whileHover={{ y: -4 }}
        className="bg-black-piano neon-blue-border rounded-[2rem] p-6 shadow-xl relative z-0"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">
              DESEMPENHO SEMANAL
            </div>
            <div className="text-lg font-black text-white tracking-tight">Fluxo de Movimentação</div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,163,255,0.8)]" />
              <span className="font-mono-tactical text-[9px] font-black text-white/40 uppercase">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="font-mono-tactical text-[9px] font-black text-white/40 uppercase">Saídas</span>
            </div>
          </div>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono' }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#00ffff', fontWeight: 900, fontSize: '10px', marginBottom: '4px' }}
              />
              <Bar 
                dataKey="in" 
                fill="#00a3ff" 
                radius={[4, 4, 0, 0]} 
                name="Entradas"
                shadow-blur="10"
              />
              <Bar 
                dataKey="out" 
                fill="#ff4444" 
                radius={[4, 4, 0, 0]} 
                name="Saídas" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          {...cascade(2)}
          icon={Boxes}
          label="UN EM ESTOQUE"
          value={inStockProducts.length.toString()}
          deltaValue={products.length > 0 ? (inStockProducts.length / products.length) * 100 : 0}
          deltaLabel={products.length > 0 ? `${((inStockProducts.length / products.length) * 100).toFixed(0)}%` : "0%"}
          tone="cyan"
          onClick={() => onNavigate?.("stock")}
        />
        <KPICard
          {...cascade(3)}
          icon={ArrowLeftRight}
          label="ITENS HOJE (TOTAL)"
          value={todayProcessed.length.toString()}
          deltaValue={growth}
          deltaLabel={growth !== 0 ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : "0%"}
          tone="cyan"
          onClick={() => onNavigate?.("moves")} 
        />
      </div>

      {/* AI Insight Card - Re-Styled in DEEP PURPLE */}
      <motion.section
        {...cascade(4)}
        whileHover={{ y: -5, scale: 1.01 }}
        className="bg-black-piano neon-purple-border relative overflow-hidden rounded-[2.5rem] p-5 sm:p-8 shadow-[0_25px_50px_rgba(168,85,247,0.2)] border-l-[5px] border-l-ai"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ai/20 via-transparent to-transparent opacity-40" />
        <div className="relative">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/30 shadow-[0_0_30px_rgba(168,85,247,0.6)] ring-2 ring-ai/50">
                <Sparkles className="h-6 w-6 text-ai" />
              </div>
              <div>
                <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-ai/80">
                  INTELIGÊNCIA ARTIFICIAL
                </div>
                <div className="text-xl font-black text-white tracking-tight">Análise Preditiva</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[140px] rounded-2xl bg-ai/20 px-4 py-2 ring-2 ring-ai/50 shadow-lg text-center">
                <span className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-ai">
                  PRECISÃO · {movements.length > 0 ? "94%" : "—"}
                </span>
              </div>
              <button 
                onClick={() => onNavigate?.("ai")}
                className="flex-1 min-w-[140px] rounded-2xl bg-ai text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                ATIVAR CÉREBRO
              </button>
            </div>

            {inStockProducts.length > 0 ? (
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-5 rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/10 hover:bg-white/[0.06] transition-all hover:ring-ai/40">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-ai" />
                  <div>
                    <div className="text-base font-black text-white">
                      Análise em espera · aguardando <span className="text-ai text-glow-ai">novos dados</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/40">
                      O sistema precisa de movimentações reais para projetar demanda.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                 <div className="text-center">
                    <Activity className="h-8 w-8 text-white/10 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Aguardando Sincronia de Inventário</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Radar - Improved Visibility & Floating Effect */}
      <motion.section 
        {...cascade(5)} 
        whileHover={{ y: -5, scale: 1.01 }}
        className="bg-black-piano neon-blue-border rounded-[2.5rem] p-5 sm:p-8 shadow-[0_25px_50px_rgba(0,163,255,0.15)]"
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.4em] text-primary">
              ANÁLISE DE MERCADO
            </div>
            <div className="text-xl font-black text-white tracking-tight">Market Share Interno</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
             <Activity className="h-6 w-6 text-primary shadow-glow-cyan" />
          </div>
        </div>
        <div className="h-96 w-full flex items-center justify-center">
          {radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="82%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="brand"
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 900, fontFamily: "JetBrains Mono" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  tick={false}
                  stroke="rgba(255,255,255,0.1)"
                />
                <Radar
                  dataKey="units"
                  stroke="#00ffff"
                  fill="#00ffff"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(0,255,255,0.2)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00ffff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/20">
              <Boxes className="h-12 w-12 opacity-20" />
              <div className="font-mono-tactical text-[10px] uppercase tracking-widest">Aguardando mais dados de marcas...</div>
            </div>
          )}
        </div>
      </motion.section>

      {/* Premium gallery - Diverse Inventory */}
      <motion.section {...cascade(6)} className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div>
            <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.5em] text-primary">
              INVENTÁRIO ATIVO
            </div>
            <div className="text-2xl font-black text-white tracking-tighter">Estoque de Alto Valor</div>
          </div>
          <div className="font-mono-tactical rounded-xl bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/30 border border-white/5 shadow-inner">
            DIVERSIDADE: {inStockProducts.length} SKUs
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {inStockProducts.map((p, i) => {
            const margin = ((p.sale - p.cost) / p.cost) * 100;
            return (
              <motion.article
                key={p.id}
                {...cascade(7 + i)}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-black-piano neon-blue-border group relative overflow-hidden rounded-[2.5rem] transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <img
                    src={p.image_url || "/products/placeholder.png"}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute right-5 top-5 flex flex-col gap-2">
                    <div className="rounded-2xl bg-success/30 px-4 py-1.5 ring-2 ring-success/60 shadow-xl backdrop-blur-xl">
                      <span className="font-mono-tactical text-xs font-black uppercase tracking-widest text-success">
                        +{isNaN(margin) || !isFinite(margin) ? "0.0" : margin.toFixed(1)}%
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProductId(p.id);
                        setCameraOpen(true);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-2 ring-primary/50 shadow-xl backdrop-blur-xl transition-all hover:bg-primary hover:text-black"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <div className="text-xl font-black text-white group-hover:text-primary transition-colors tracking-tight">{p.name}</div>
                    <div className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mt-2">{p.spec}</div>
                  </div>
                  
                  <div className="font-mono-tactical flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-[11px] font-black text-white/40 ring-1 ring-white/5 group-hover:ring-primary/30 group-hover:text-white/60 transition-all">
                    <Zap className="h-4 w-4 text-primary shadow-glow-cyan animate-pulse" />
                    {p.imei ? `ID ${p.imei.slice(0, 6)}·••••·${p.imei.slice(-4)}` : `LOTE · ID ${p.id.slice(0, 8)}`}
                  </div>

                  <div className="flex items-end justify-between border-t border-white/5 pt-6">
                    <div>
                      <div className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/20">
                        ESTOQUE CUSTO
                      </div>
                      <div className="font-mono-tactical text-lg font-black text-white/50">
                        R$ {p.cost.toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-primary/80">
                        SUGESTÃO VENDA
                      </div>
                      <div className="font-mono-tactical text-2xl font-black text-primary text-glow-cyan">
                        R$ {p.sale.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <CameraView
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setEditingProductId(null);
        }}
        title="Atualizar Foto do Produto"
        mode="photo"
        onCapture={async (url) => {
          if (editingProductId) {
            await updateProduct(editingProductId, { image_url: url });
          }
        }}
      />
    </div>
  );
};

interface KPICardProps {
  icon: typeof Boxes;
  label: string;
  value: string;
  deltaLabel?: string;
  deltaValue?: number;
  tone: "cyan" | "ai";
  onClick?: () => void;
  initial?: any;
  animate?: any;
  transition?: any;
}

const KPICard = ({ icon: Icon, label, value, deltaLabel, deltaValue = 0, tone, onClick, ...rest }: KPICardProps) => {
  const isPositive = deltaValue > 0;
  const isNegative = deltaValue < 0;
  const isNeutral = deltaValue === 0;

  return (
    <motion.div 
      {...rest} 
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`bg-black-piano neon-blue-border relative overflow-hidden rounded-[2rem] p-4 sm:p-6 shadow-xl hover:shadow-[0_20px_40px_rgba(0,163,255,0.2)] transition-all ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="font-mono-tactical text-[11px] font-black uppercase tracking-widest text-white/20 truncate">
            {label}
          </div>
          <div className="font-mono-tactical mt-4 text-4xl font-black text-white tracking-tighter truncate">{value}</div>
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full ring-1 ${
            isPositive ? 'text-success bg-success/10 ring-success/30' : 
            isNegative ? 'text-danger bg-danger/10 ring-danger/30' : 
            'text-white/30 bg-white/5 ring-white/10'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : isNegative ? <TrendingDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            <span className="font-mono-tactical text-[12px] font-black">{deltaLabel || '0%'}</span>
          </div>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-2 shadow-2xl transition-all duration-500 ${
            tone === "cyan" ? "bg-primary/20 text-primary ring-primary/40 shadow-[0_0_25px_rgba(0,163,255,0.4)]" : "bg-ai/20 text-ai ring-ai/40 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          }`}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </motion.div>
  );
};

