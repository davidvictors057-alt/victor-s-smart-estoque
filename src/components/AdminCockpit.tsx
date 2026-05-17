import { useState, useRef } from "react";
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
  PieChart,
  Pie,
  Cell,
  Sector,
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
  Zap,
  LayoutDashboard,
  Check,
  Camera,
  Info,
  Package,
  ShoppingCart,
  Users,
  Eye,
  Brain,
} from "lucide-react";
import { CameraView } from "./CameraView";
import { AIProductInsight } from './AIProductInsight';
import { PredictiveShoppingList } from './PredictiveShoppingList';
import { ColdStockActionModal } from "./ColdStockActionModal";
import { Button } from "./ui/button";
import { useStore, type Product } from "@/store/useStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { aiService } from "@/services/aiService";
import { imageService } from "@/services/imageService";
import { toast } from "sonner";

// Custom components for Markdown to handle semantic colors (Synced with AIView)
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-black text-white mt-6 mb-3 border-b border-ai/30 pb-2 uppercase tracking-tighter text-glow-ai">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-black text-white mt-5 mb-2 uppercase tracking-tighter text-glow-ai">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-black text-ai mt-4 mb-1 uppercase tracking-tighter">{children}</h3>,
  p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-justify">{children}</p>,
  ul: ({ children }: any) => <ul className="list-none space-y-2 mb-4">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ai shrink-0 shadow-[0_0_5px_rgba(0,163,255,0.8)]" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: any) => <strong className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{children}</strong>,
  desc: ({ children }: any) => <span className="text-[10px] font-bold text-ai/80 bg-ai/5 px-1.5 py-0.5 rounded border border-ai/20 mx-1 uppercase tracking-tighter">{children}</span>,
  price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
  warn: ({ children }: any) => <span className="font-black text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{children}</span>,
  name: ({ children }: any) => <span className="font-black text-white border-b border-white/30 pb-0.5">{children}</span>,
  hr: () => <hr className="my-4 border-white/10" />,
};



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
    lastAiAnalysisModel,
    isAiLoading,
    onlineBrainMode,
    runPredictiveAnalysis,
    currentUser
  } = useStore();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tooltipMetric, setTooltipMetric] = useState<string | null>(null);
  const [marketInsight, setMarketInsight] = useState<string | null>(null);
  const [isMarketAiLoading, setIsMarketAiLoading] = useState(false);
  const [coldStockModalOpen, setColdStockModalOpen] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const vibrantColors = ['#22c55e', '#ff4444', '#facc15', '#f97316', '#00ffff', '#00a3ff', '#ec4899', '#8b5cf6', '#f43f5e', '#10b981'];

  const runMarketAnalysis = async () => {
    setIsMarketAiLoading(true);
    try {
      const distribution = radarData
        .map((d) => `${d.brand}: ${d.units} unidades`)
        .join(', ');

      const prompt = `Gere um RELATÓRIO TÁTICO EXECUTIVO (HUD STYLE) baseado nesta distribuição de estoque: ${distribution}. 
      
      ESTRUTURA OBRIGATÓRIA:
      # 📊 PANORAMA GERAL
      (Resumo rápido do estado atual)
      
      # 🎯 MARCAS DOMINANTES
      (Análise de quem manda no estoque agora)
      
      # ⚠️ RISCOS E OPORTUNIDADES
      (Alertas de concentração ou falta de produtos)
      
      # 💡 RECOMENDAÇÃO TÁTICA
      (O que fazer agora para lucrar mais)

      REGRAS CRÍTICAS:
      - INICIE DIRETAMENTE NO TÍTULO # 📊 PANORAMA GERAL.
      - NÃO use introduções como "Aqui está o relatório" ou "Com certeza".
      - Use tons profissionais e táticos.
      - Use emojis para facilitar a leitura.
      - Use <warn> para alertas e <price> para valores.
      - NÃO use códigos de máquina ou IDs internos.
      - Texto 100% limpo e direto ao ponto.`;

      const response = await aiService.chat(prompt);
      setMarketInsight(response.text);
    } catch (err) {
      toast.error("Erro na análise neural do mercado.");
    } finally {
      setIsMarketAiLoading(false);
    }
  };

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

  // 🧠 INTELLIGENT MARKET SHARE LOGIC (9+1 Sectors)
  const getBrandSector = (p: Product) => {
    const brandField = (p.brand || "").toUpperCase();
    const name = p.name.toUpperCase();

    if (brandField.includes('XIAOMI') || name.includes('XIAOMI') || name.includes('REDMI') || name.includes('POCO')) return 'XIAOMI';
    if (brandField.includes('APPLE') || name.includes('APPLE') || name.includes('IPHONE')) return 'APPLE';
    if (brandField.includes('SAMSUNG') || name.includes('SAMSUNG') || name.includes('GALAXY')) return 'SAMSUNG';
    if (brandField.includes('REALME') || name.includes('REALME')) return 'REALME';
    if (brandField.includes('MOTOROLA') || name.includes('MOTO ')) return 'MOTOROLA';
    if (brandField.includes('ITEL') || name.includes('ITEL')) return 'ITEL';
    if (brandField.includes('MULTI') || name.includes('MULTI')) return 'MULTILASER';

    if (brandField && brandField !== 'GERAL' && brandField !== 'OUTROS') return brandField;
    const firstWord = name.split(' ')[0];
    return firstWord.length > 2 ? firstWord : 'OUTROS';
  };

  const fifteenDaysAgo = new Date(Date.now() - (15 * 24 * 60 * 60 * 1000));
  const recentSales = movements.filter(m => m.type === 'out' && new Date(m.timestamp) > fifteenDaysAgo);

  const inStockProducts = products.filter(p => p.status === 'in_stock');

  // Calculate metrics per sector
  const sectorMetrics = inStockProducts.reduce((acc: Record<string, { units: number, stockValue: number, salesValue: number }>, p) => {
    const sector = getBrandSector(p);
    if (!acc[sector]) acc[sector] = { units: 0, stockValue: 0, salesValue: 0 };
    acc[sector].units += 1;
    acc[sector].stockValue += (p.cost || 0);
    return acc;
  }, {});

  // Add sales value to metrics
  recentSales.forEach(m => {
    const p = m.product;
    if (p) {
      const sector = getBrandSector(p);
      if (sectorMetrics[sector]) {
        sectorMetrics[sector].salesValue += (p.cost || 0);
      }
    }
  });

  // Calculate Power Index and Sort
  const allSectors = Object.entries(sectorMetrics).map(([brand, metrics]) => ({
    brand,
    units: metrics.units,
    score: metrics.stockValue + (metrics.salesValue * 2) // Weighted Power Index
  })).sort((a, b) => b.score - a.score);

  // 9+1 Logic: Top 9 + Others
  const top9 = allSectors.filter(s => s.brand !== 'OUTROS').slice(0, 9);
  const othersData = allSectors.filter(s => s.brand === 'OUTROS' || !top9.find(t => t.brand === s.brand));

  const totalOthersUnits = othersData.reduce((sum, s) => sum + s.units, 0);

  const radarData = [
    ...top9,
    { brand: 'OUTROS', units: totalOthersUnits, score: 0 }
  ].filter(s => s.units > 0);

  // Total value in stock (ONLY IN STOCK)
  const totalPatrimony = inStockProducts.reduce((sum, p) => sum + (p.cost || 0), 0);
  const formattedPatrimony = totalPatrimony.toLocaleString("pt-BR");
  const [, cents] = totalPatrimony.toFixed(2).split(".");

  // Daily movements (TODAY & YESTERDAY) using local time normalization
  const formatLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatLocalISO(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalISO(yesterday);

  const todayProcessed = movements.filter(m => {
    if (!m.timestamp) return false;

    // Normalização agressiva para navegadores mobile
    let isoString = m.timestamp.replace(' ', 'T');
    if (isoString.includes('.')) {
      isoString = isoString.split('.')[0] + (isoString.includes('+') ? '+' + isoString.split('+')[1] : 'Z');
    }

    const mDate = new Date(isoString);
    return !isNaN(mDate.getTime()) && formatLocalISO(mDate) === todayStr && m.type === 'in';
  });

  const yesterdayProcessed = movements.filter(m => {
    if (!m.timestamp) return false;

    // Normalização agressiva para navegadores mobile
    let isoString = m.timestamp.replace(' ', 'T');
    if (isoString.includes('.')) {
      isoString = isoString.split('.')[0] + (isoString.includes('+') ? '+' + isoString.split('+')[1] : 'Z');
    }

    const mDate = new Date(isoString);
    return !isNaN(mDate.getTime()) && formatLocalISO(mDate) === yesterdayStr && m.type === 'in';
  });

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

  const ruptureItems = Array.from(new Set(inStockProducts.map(p => p.name)))
    .filter(name => inStockProducts.filter(p => p.name === name).length <= 1);

  const coldStockCount = inStockProducts.filter(p => {
    const lastUpdate = new Date(p.updated_at || Date.now());
    const diffDays = Math.ceil((new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 30;
  }).length;

  const profiles = Array.from(new Set(movements.map(m => m.operator_id))).map(id => {
    const m = movements.find(mv => mv.operator_id === id);
    return { id, full_name: m?.operator?.full_name || "Operador" };
  });

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-24">
      {/* Header Cockpit - Enhanced Floating Effect */}
      <motion.header
        {...cascade(0)}
        whileHover={{ scale: 1.01, y: -2 }}
        className="bg-black-piano neon-blue-border flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,163,255,0.2)] gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary text-black shadow-glow-cyan shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <div className="font-mono-tactical text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary truncate">
              ADMIN COCKPIT
            </div>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tighter truncate">Terminal de Comando</div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate?.("ai_vision")}
            className="flex-1 sm:flex-none h-11 px-4 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary hover:text-black shadow-glow-cyan gap-2"
          >
            <Camera className="h-4 w-4" />
            <span className="font-mono-tactical text-[9px] font-black uppercase tracking-widest hidden sm:block">AUDITORIA IA</span>
          </button>
          <button
            onClick={() => setShoppingListOpen(true)}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white transition-all hover:bg-white/10 shrink-0"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !editingProductId) return;

              const toastId = toast.loading("Processando imagem...");
              const reader = new FileReader();
              reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                try {
                  const storedUrl = await imageService.processBase64(base64, `cockpit-update-${editingProductId}.webp`);
                  if (storedUrl) {
                    await updateProduct(editingProductId, { image_url: storedUrl });
                    toast.success("Foto atualizada!", { id: toastId });
                  } else {
                    toast.error("Falha ao processar imagem", { id: toastId });
                  }
                } catch (err) {
                  console.error(err);
                  toast.error("Erro na sincronização", { id: toastId });
                } finally {
                  setEditingProductId(null);
                }
              };
              reader.onerror = () => toast.error("Erro ao ler arquivo", { id: toastId });
              reader.readAsDataURL(file);
              if (e.target) e.target.value = "";
            }}
          />
          <button
            onClick={handleRefresh}
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white transition-all hover:bg-white/10 hover:text-white shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <ArrowLeftRight className="h-5 w-5 rotate-90" />
          </button>
          <div className="font-mono-tactical text-right hidden sm:block bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
            <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 mb-0.5">Integridade do Sistema</div>
            <div className="text-sm font-black text-success text-glow-success flex items-center gap-2 justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {integrity.toFixed(1)}%
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
                R$ {formattedPatrimony}<span className="text-2xl text-white">,{cents}</span>
              </div>
              {formattedPatrimony !== "0" && (
                <div className="mt-6 flex items-center gap-4">
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-1.5 ring-2 shadow-2xl ${growth > 0 ? 'bg-success/20 ring-success/50 text-success shadow-success/20' : growth < 0 ? 'bg-danger/20 ring-danger/50 text-danger shadow-danger/20' : 'bg-white/5 ring-white/10 text-white shadow-none'}`}>
                    {growth > 0 ? <TrendingUp className="h-4 w-4" /> : growth < 0 ? <TrendingDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    <span className="font-mono-tactical text-xs font-black">{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
                  </div>
                  <span className="font-mono-tactical text-[11px] font-black uppercase tracking-widest text-white">
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
                  <div className="font-mono-tactical text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white truncate">
                    {s.label}
                  </div>
                  <button
                    onClick={() => setTooltipMetric(s.label === tooltipMetric ? null : s.label)}
                    className="text-white hover:text-primary transition-colors"
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
                      key={`metric-tooltip-${s.label}`}
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
                      <div className="text-[11px] leading-relaxed text-white font-medium">
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

      {/* ⚠️ CRITICAL ALERTS: Ruptura Zero */}
      <AnimatePresence>
        {ruptureItems.length > 0 && (
          <motion.section
            key="rupture-alert-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-danger/10 neon-danger-border rounded-[2rem] p-5 border border-danger/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex items-center justify-center rounded-2xl bg-danger/20 border border-danger/30">
                  <Package className="h-6 w-6 text-danger animate-pulse" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-danger rounded-full flex items-center justify-center border-2 border-[#0f172a]">
                    <span className="text-[8px] font-black text-white">{ruptureItems.length}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Ruptura Zero</h3>
                  <p className="text-[10px] text-danger font-black uppercase tracking-widest opacity-80">Ação imediata requerida</p>
                </div>
              </div>
              <Button
                onClick={() => setShoppingListOpen(true)}
                className="h-10 px-4 bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger rounded-xl text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Gerar Lista
              </Button>
            </div>

            <div className="space-y-3">
              {ruptureItems.slice(0, 3).map((name, rIdx) => (
                <div key={`rupture-item-${rIdx}`} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                  <span className="text-sm font-bold text-white">{name.replace(/<.*?>/g, '')}</span>
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/80 h-auto py-1 px-3 rounded-lg flex flex-col items-center justify-center shrink-0"
                    onClick={() => {
                      const text = `🚨 ALERTA RUPTURA ZERO: O item *${name}* está com apenas 1 unidade no estoque. Sugiro reposição imediata.`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <span className="text-[10px] font-black uppercase leading-none tracking-wider text-black">AVISAR</span>
                    <span className="text-[9px] font-black uppercase leading-none tracking-wider text-black mt-0.5">COMPRADOR</span>
                  </Button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
              <div className="text-[8px] uppercase tracking-widest text-white">Cérebro</div>
              <div className={`text-[10px] font-black ${onlineBrainMode ? 'text-ai' : 'text-white'}`}>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="neon-purple-border rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-ai/10 blur-[100px] pointer-events-none" />

              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest text-glow-purple">Relatório de Inteligência Preditiva</h4>
                    <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-tighter">Protocolo Nexus Oracle v3.1</p>
                  </div>
                </div>
                <div className="font-mono-tactical text-[9px] text-white/30 font-black uppercase tracking-widest hidden sm:block">
                  MODEL: {lastAiAnalysisModel}
                </div>
              </div>

              <div className="prose-ai-insight text-[13px] leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={MarkdownComponents as any}
                >
                  {lastAiAnalysis}
                </ReactMarkdown>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  🎯 Próxima recalibração sugerida em 24h
                </p>
                <button
                  onClick={runPredictiveAnalysis}
                  disabled={isAiLoading}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-black transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isAiLoading ? <Activity className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  {isAiLoading ? 'RECALCULANDO...' : 'RECALCULAR INSIGHTS'}
                </button>
              </div>
            </div>
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
              FLUXO TÁTICO (15 DIAS)
            </div>
            <div className="text-lg font-black text-white tracking-tight">Entradas vs Saídas</div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,163,255,0.8)]" />
              <span className="font-mono-tactical text-[9px] font-black text-white uppercase">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="font-mono-tactical text-[9px] font-black text-white uppercase">Saídas</span>
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

      <div className="grid grid-cols-1 gap-4">
        <KPICard
          {...cascade(2)}
          icon={Boxes}
          label="ESTOQUE FRIO (>30 DIAS)"
          value={coldStockCount.toString()}
          deltaValue={coldStockCount}
          deltaLabel={`${((coldStockCount / (inStockProducts.length || 1)) * 100).toFixed(0)}%`}
          tone="cyan"
          onClick={() => setColdStockModalOpen(true)}
        />
        <KPICard
          {...cascade(3)}
          icon={Eye}
          label="AUDITORIA VISUAL (IA VISION)"
          value="ATIVO"
          deltaLabel="SISTEMA"
          deltaValue={1}
          tone="ai"
          onClick={() => onNavigate?.("ai_vision")}
        />
        <KPICard
          {...cascade(4)}
          icon={ArrowLeftRight}
          label="AÇÕES PROCESSADAS HOJE"
          value={todayProcessed.length.toString()}
          deltaValue={growth}
          deltaLabel={growth !== 0 ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : "0%"}
          tone="cyan"
          onClick={() => onNavigate?.("moves")}
        />
      </div>

      {/* 🚀 TEAM PERFORMANCE VISUALIZATION */}
      <motion.section
        {...cascade(4)}
        className="bg-black-piano neon-cyan-border rounded-[2.5rem] p-6 border border-white/5 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">PERFORMANCE DE EQUIPE</div>
            <div className="text-lg font-black text-white">Top Operadores</div>
          </div>
        </div>

        <div className="space-y-4">
          {profiles.slice(0, 3).map((profile, idx) => {
            const userMoves = movements.filter(m => m.operator_id === profile.id).length;
            const maxMoves = Math.max(...profiles.map(p => movements.filter(m => m.operator_id === p.id).length), 1);
            const percentage = (userMoves / maxMoves) * 100;

            return (
              <div key={profile.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white">0{idx + 1}</span>
                    <span className="text-sm font-bold text-white">{profile.full_name.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] font-black text-cyan-400">{userMoves} AÇÕES</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* AI Insight Card - Oráculo Interno Style */}
      <motion.section
        {...cascade(6)}
        className="bg-black-piano rounded-[2.5rem] p-6 sm:p-8 border-l-[6px] border-l-ai relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="h-20 w-20 text-ai" />
        </div>
        <div className="relative">
          <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-ai/60 mb-2">SISTEMA ORÁCULO OPERACIONAL</div>
          <h2 className="text-2xl font-black text-white mb-6">Brain de Gestão Ativado</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="text-[9px] font-black text-white uppercase mb-1">Giro Previsto</div>
              <div className="text-lg font-black text-white">15 DIAS</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="text-[9px] font-black text-white uppercase mb-1">Ruptura Zero</div>
              <div className="text-lg font-black text-success">ATIVO</div>
            </div>
          </div>

          <Button
            className="w-full bg-ai hover:bg-ai/80 text-black font-black py-6 rounded-2xl shadow-glow-ai text-xs tracking-widest uppercase"
            onClick={() => onNavigate?.("ai")}
          >
            CONSULTAR ESTRATÉGIA
          </Button>
        </div>
      </motion.section>

      {/* 🥧 Market Share - Premium Donut Chart */}
      <motion.section
        {...cascade(5)}
        whileHover={{ y: -5 }}
        className="bg-black-piano neon-blue-border rounded-[2.5rem] p-5 sm:p-8 shadow-[0_25px_50px_rgba(0,163,255,0.15)] relative overflow-hidden"
      >
        <div className="absolute inset-0 tactical-grid opacity-5" />

        <div className="mb-8 flex items-center justify-between relative z-10">
          <div>
            <div className="font-mono-tactical text-[12px] font-black uppercase tracking-[0.4em] text-primary">
              ANÁLISE DE MERCADO
            </div>
            <div className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              Market Share Interno
              <span className="bg-primary/20 text-primary text-[10px] px-3 py-1 rounded-full border border-primary/30 shadow-glow-cyan animate-pulse">
                {inStockProducts.length} TOTAL
              </span>
            </div>
          </div>
          <button
            onClick={runMarketAnalysis}
            disabled={isMarketAiLoading}
            className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all ${isMarketAiLoading
                ? 'bg-primary/10 text-primary animate-spin'
                : 'bg-primary/20 text-primary hover:bg-primary hover:text-black shadow-glow-cyan active:scale-95'
              }`}
          >
            <Sparkles className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col gap-10 items-center relative z-10">
          <div className="h-80 w-full relative">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeSegmentIndex}
                    activeShape={(props: any) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      return (
                        <g>
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius}
                            outerRadius={outerRadius + 8}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                          />
                          <Sector
                            cx={cx}
                            cy={cy}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            innerRadius={outerRadius + 12}
                            outerRadius={outerRadius + 15}
                            fill={fill}
                          />
                        </g>
                      );
                    }}
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="units"
                    onMouseEnter={(_, index) => setActiveSegmentIndex(index)}
                  >
                    {radarData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={vibrantColors[index % vibrantColors.length]}
                        stroke="rgba(255,255,255,0.05)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(0,255,255,0.2)', borderRadius: '12px' }}
                    itemStyle={{ color: '#00ffff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-white">
                <Boxes className="h-12 w-12 opacity-20" />
                <div className="font-mono-tactical text-[10px] uppercase tracking-widest text-white/30">Aguardando dados...</div>
              </div>
            )}

            {/* Center Text for Donut - Empty for cleaner look as requested */}
            {radarData.length > 0 && (
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-20">
                <div className="text-[8px] font-black text-primary/40 uppercase tracking-[0.3em] leading-none mb-1.5">{radarData[activeSegmentIndex]?.brand}</div>
                <div className="h-1 w-12 bg-primary/20 rounded-full mx-auto" />
              </div>
            )}

            {/* Marcador flutuante (O "73") - Agora no topo lateral para não obstruir o diagnóstico */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={activeSegmentIndex}
              className="absolute -top-6 right-0 bg-black-piano border border-white/10 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl z-30 flex items-center gap-3"
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-glow-cyan animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Total Segmento</span>
                <span className="text-xl font-black text-white leading-none font-mono-tactical">
                  {radarData[activeSegmentIndex]?.units} <span className="text-[10px] text-primary">UN</span>
                </span>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 w-full">
            {marketInsight ? (
              <motion.div
                key="market-insight-neural"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-mono-tactical text-[10px] font-black text-primary uppercase tracking-widest">Neural Insight</span>
                </div>
                <div className="text-[12px] text-white/90 leading-relaxed prose-ai-insight max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={MarkdownComponents as any}
                  >
                    {marketInsight}
                  </ReactMarkdown>
                </div>
                <button
                  onClick={() => setMarketInsight(null)}
                  className="mt-4 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest"
                >
                  LIMPAR ANÁLISE
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {radarData.map((entry, index) => (
                  <div key={`market-sector-${entry.brand}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: vibrantColors[index % vibrantColors.length] }} />
                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{entry.brand}</span>
                    </div>
                    <span className="font-mono-tactical text-[10px] font-black text-white/50">{entry.units} UN</span>
                  </div>
                ))}
                {!isMarketAiLoading && (
                  <p className="text-[10px] text-white/20 italic text-center pt-2">Clique no ícone de brilho para análise de IA</p>
                )}
              </div>
            )}
          </div>
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
          <div className="font-mono-tactical rounded-xl bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white border border-white/5 shadow-inner">
            DIVERSIDADE: {inStockProducts.length} SKUs
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {inStockProducts.map((p, i) => {
            const margin = ((p.sale - p.cost) / p.cost) * 100;
            return (
              <motion.article
                key={`cockpit-prod-${p.id}-${i}`}
                {...cascade(7 + i)}
                whileHover={{ y: -8, scale: 1.03 }}
                className="bg-black-piano neon-blue-border group relative overflow-hidden rounded-[2.5rem] transition-all hover:shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <img
                    src={
                      p.image_url ||
                      useStore.getState().catalog.find(c => c.sku === p.sku && c.image_url)?.image_url ||
                      useStore.getState().catalog.find(c => c.name === p.name && c.image_url)?.image_url ||
                      "/products/placeholder.png"
                    }
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
                        fileInputRef.current?.click();
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
                    <div className="text-xs font-black text-white uppercase tracking-[0.3em] mt-2">{p.spec}</div>
                  </div>

                  <div className="font-mono-tactical flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-[11px] font-black text-white ring-1 ring-white/5 group-hover:ring-primary/30 group-hover:text-white transition-all">
                    <Zap className="h-4 w-4 text-primary shadow-glow-cyan animate-pulse" />
                    {p.imei ? `ID ${p.imei.slice(0, 6)}·••••·${p.imei.slice(-4)}` : `LOTE · ID ${p.id.slice(0, 8)}`}
                  </div>

                  <div className="flex items-end justify-between border-t border-white/5 pt-6">
                    <div>
                      <div className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white">
                        ESTOQUE CUSTO
                      </div>
                      <div className="font-mono-tactical text-lg font-black text-white">
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

      <AIProductInsight
        product={selectedProduct}
        isOpen={insightOpen}
        onClose={() => setInsightOpen(false)}
      />

      <PredictiveShoppingList
        isOpen={shoppingListOpen}
        onClose={() => setShoppingListOpen(false)}
      />

      <ColdStockActionModal
        isOpen={coldStockModalOpen}
        onClose={() => setColdStockModalOpen(false)}
      />

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
          <div className="font-mono-tactical text-[11px] font-black uppercase tracking-widest text-white truncate">
            {label}
          </div>
          <div className="font-mono-tactical mt-4 text-4xl font-black text-white tracking-tighter truncate">{value}</div>
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full ring-1 ${isPositive ? 'text-success bg-success/10 ring-success/30' :
              isNegative ? 'text-danger bg-danger/10 ring-danger/30' :
                'text-white bg-white/5 ring-white/10'
            }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : isNegative ? <TrendingDown className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            <span className="font-mono-tactical text-[12px] font-black">{deltaLabel || '0%'}</span>
          </div>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-2 shadow-2xl transition-all duration-500 ${tone === "cyan" ? "bg-primary/20 text-primary ring-primary/40 shadow-[0_0_25px_rgba(0,163,255,0.4)]" : "bg-ai/20 text-ai ring-ai/40 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            }`}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </motion.div>
  );
};

