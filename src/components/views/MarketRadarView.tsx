import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  BarChart3, 
  DollarSign, 
  Activity, 
  ExternalLink,
  RefreshCw,
  LayoutDashboard
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { mlService } from "@/services/mercadoLivreService";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const MarketRadarView = () => {
  const [query, setQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const { products } = useStore();

  // Group products by EAN/Name for research
  const items = (products || [])
    .filter(p => p.status === 'in_stock')
    .reduce((acc, p) => {
      const key = (p.sku || p.name).toLowerCase();
      if (!acc[key]) {
        acc[key] = { ...p, stock: 0 };
      }
      acc[key].stock += 1;
      return acc;
    }, {} as Record<string, any>);

  const filteredItems = Object.values(items).filter(i => 
    i.name.toLowerCase().includes(query.toLowerCase()) || 
    (i.sku && i.sku.includes(query))
  );

  const handleResearch = async (item: any) => {
    const key = item.sku || item.name;
    setLoadingItems(prev => ({ ...prev, [key]: true }));
    
    try {
      const results = await mlService.searchByEAN(item.sku || item.name);
      
      if (results.length === 0) {
        toast.error("Nenhum concorrente Platinum/Gold encontrado para este EAN.");
        setLoadingItems(prev => ({ ...prev, [key]: false }));
        return;
      }

      setMarketData(prev => ({ ...prev, [key]: results }));
      
      // Get AI Insights
      const insight = await aiService.getMarketAnalysis(item, results);
      setAiInsights(prev => ({ ...prev, [key]: insight.text }));
      
      toast.success("Análise de mercado concluída!");
    } catch (err) {
      toast.error("Falha na pesquisa de mercado.");
    } finally {
      setLoadingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6 px-3 pb-32">
      {/* Header Tático */}
      <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 tactical-grid opacity-20" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 shadow-glow-cyan ring-1 ring-primary/40">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-primary/70">
              RADAR DE ARBITRAGEM
            </div>
            <div className="text-2xl font-black text-white text-glow-cyan">Monitor de Mercado</div>
            <div className="font-mono-tactical mt-1 text-[10px] font-black uppercase tracking-widest text-white/20">
              Sincronizado com Mercado Livre Platinum
            </div>
          </div>
        </div>
      </section>

      {/* Busca */}
      <div className="bg-black-piano neon-blue-border-thin flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg">
        <Search className="h-5 w-5 text-primary/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar item para análise..."
          className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white/10"
        />
      </div>

      <div className="space-y-4">
        {filteredItems.map((item, idx) => {
          const key = item.sku || item.name;
          const results = marketData[key];
          const insight = aiInsights[key];
          const isLoading = loadingItems[key];
          const lowestPrice = results?.[0]?.price;
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-black-piano neon-blue-border rounded-[2rem] p-6 shadow-xl overflow-hidden relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black border border-white/5">
                    <img src={item.image_url || "/products/placeholder.png"} className="h-full w-full object-cover opacity-60" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">{item.name}</h3>
                    <div className="font-mono-tactical text-[10px] text-primary uppercase tracking-widest mt-1">EAN: {item.sku || "N/A"}</div>
                    <div className="font-mono-tactical text-[9px] text-white/20 uppercase mt-1">Seu Custo: R$ {item.buy_price || item.cost || 0}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleResearch(item)}
                  disabled={isLoading}
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isLoading ? 'bg-primary/10 text-primary animate-spin' : 'bg-white/5 text-primary hover:bg-primary hover:text-black shadow-glow-cyan'}`}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {results ? (
                <div className="space-y-6">
                  {/* Grid de Preços */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase mb-1">MENOR PLATINUM</div>
                      <div className="text-lg font-black text-emerald-400">R$ {lowestPrice}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 text-center">
                      <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase mb-1">SEU PREÇO</div>
                      <div className="text-lg font-black text-white">R$ {item.sale || 0}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 text-right">
                      <div className="font-mono-tactical text-[8px] font-black text-white/30 uppercase mb-1">DIFERENÇA</div>
                      <div className={`text-lg font-black ${item.sale < lowestPrice ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {(((item.sale - lowestPrice) / lowestPrice) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Calculadora de Lucro (Exemplo baseada no menor preço) */}
                  {(() => {
                    const profitData = mlService.calculateNetProfit(item.sale || 0, item.buy_price || item.cost || 0);
                    return (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-emerald-400/60 uppercase">LUCRO LÍQUIDO ESTIMADO</div>
                            <div className="text-lg font-black text-emerald-400">R$ {profitData.profit} <span className="text-xs opacity-50 ml-1">({profitData.margin}%)</span></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-white/20 uppercase">TAXAS ML</div>
                          <div className="text-sm font-black text-white/40">R$ {profitData.mlFee}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Insights de IA */}
                  <AnimatePresence>
                    {insight && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-ai/10 border border-ai/20 rounded-2xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-ai" />
                          <span className="font-mono-tactical text-[10px] font-black text-ai uppercase tracking-widest">IA MARKET INSIGHT</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed font-medium">
                          <ReactMarkdown>{insight}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Link para o Mercado Livre */}
                  <a 
                    href={results[0].permalink} 
                    target="_blank" 
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    VER CONCORRENTE NO ML <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                  <Activity className="h-8 w-8 text-white/10 mb-3" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center px-10">
                    Aguardando varredura estratégica de mercado para este EAN
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
