import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Zap, 
  DollarSign, 
  Activity, 
  ExternalLink,
  RefreshCw,
  LayoutDashboard,
  TrendingUp
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { mlService, MLPriceData } from "@/services/mercadoLivreService";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const MarketRadarView = () => {
  const [query, setQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [marketPrices, setMarketPrices] = useState<Record<string, any>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const { products, appSettings, updateAppSetting } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const isConnected = !!appSettings?.ml_access_token;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !isConnected) {
      handleAuth(code);
    }
  }, []);

  const handleAuth = async (code: string) => {
    setIsSyncing(true);
    toast.loading("Estabelecendo conexão tática...", { id: 'ml-auth' });
    try {
      const data = await mlService.exchangeCodeForToken(code);
      if (data && data.access_token) {
        await updateAppSetting('ml_access_token', data.access_token);
        await updateAppSetting('ml_refresh_token', data.refresh_token);
        await updateAppSetting('ml_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
        toast.success("CONEXÃO ESTABELECIDA", { id: 'ml-auth' });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      toast.error("FALHA NA CONEXÃO", { id: 'ml-auth' });
    } finally {
      setIsSyncing(false);
    }
  };

  const startLogin = () => {
    window.location.href = mlService.getAuthUrl();
  };

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
      const accessToken = appSettings.ml_access_token;
      
      // BUSCA DADOS DE MERCADO (PLATINUM/GOLD)
      let marketInfo = await mlService.getMarketData(item.sku, accessToken);
      if (!marketInfo) {
        marketInfo = await mlService.getMarketData(item.name, accessToken);
      }

      if (!marketInfo) {
        toast.error("Preço de mercado não encontrado.");
        setLoadingItems(prev => ({ ...prev, [key]: false }));
        return;
      }

      setMarketPrices(prev => ({ ...prev, [key]: marketInfo }));
      
      // Get AI Insights based on market data
      // Passamos a lista de resultados e o preço sugerido para a IA
      const insight = await aiService.getMarketAnalysis(item, marketInfo.results);
      setAiInsights(prev => ({ ...prev, [key]: insight.text }));
      
      toast.success("Varredura concluída!");
    } catch (err) {
      toast.error("Erro na varredura.");
    } finally {
      setLoadingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6 px-3 pb-32">
      {/* Header Tático */}
      <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl">
        <div className="absolute inset-0 tactical-grid opacity-20" />
        <div className="relative flex flex-row items-center justify-between gap-4 min-h-[80px]">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 shadow-glow-cyan ring-1 ring-primary/40">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 truncate">RADAR TÁTICO</div>
              <div className="text-xl font-black text-white text-glow-cyan truncate">Monitor</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`h-2 w-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-rose-500 shadow-glow-rose'}`} />
                <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-white/90">
                  {isConnected ? "ONLINE" : "OFFLINE"}
                </div>
              </div>
            </div>
          </div>
          {!isConnected && (
            <button onClick={startLogin} className="shrink-0 h-12 px-6 rounded-2xl bg-primary text-black font-black text-[11px] uppercase tracking-widest shadow-glow-cyan active:scale-95 transition-all">Ligar</button>
          )}
        </div>
      </section>

      {/* Busca */}
      <div className="bg-black-piano neon-blue-border-thin flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg">
        <Search className="h-5 w-5 text-primary/60" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar item para análise..." className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white" />
      </div>

      <div className="space-y-4">
        {filteredItems.map((item, idx) => {
          const key = item.sku || item.name;
          const marketData = marketPrices[key];
          const insight = aiInsights[key];
          const isLoading = loadingItems[key];
          
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-black-piano neon-blue-border rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black border border-white/5">
                    <img src={item.image_url || "/products/placeholder.png"} className="h-full w-full object-cover opacity-60" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">{item.name}</h3>
                    <div className="font-mono-tactical text-[10px] text-primary uppercase tracking-widest mt-1">EAN: {item.sku || "N/A"}</div>
                    <div className="font-mono-tactical text-[9px] text-white uppercase mt-1">Custo: R$ {item.buy_price || item.cost || 0}</div>
                  </div>
                </div>
                <button onClick={() => handleResearch(item)} disabled={isLoading} className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isLoading ? 'bg-primary/10 text-primary animate-spin' : 'bg-white/5 text-primary hover:bg-primary shadow-glow-cyan'}`}>
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {marketData ? (
                <div className="space-y-6">
                  {/* Grid de Preços Diretos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <div className="font-mono-tactical text-[8px] font-black text-white/40 uppercase mb-1">MERCADO REAL (ML)</div>
                      <div className="text-xl font-black text-emerald-400">R$ {marketData.bestPrice}</div>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-primary/20 shadow-glow-cyan/10">
                      <div className="font-mono-tactical text-[8px] font-black text-primary/60 uppercase mb-1">SUGERIDO (PLATINUM/GOLD)</div>
                      <div className="text-xl font-black text-primary">R$ {marketData.suggestedPrice}</div>
                    </div>
                  </div>

                  {/* Insights da IA */}
                  <AnimatePresence>
                    {insight && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-primary/10 border border-primary/20 rounded-2xl p-5 shadow-glow-cyan">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-mono-tactical text-[10px] font-black text-primary uppercase tracking-widest">SUGESTÃO ESTRATÉGICA IA</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-white leading-relaxed">
                          <ReactMarkdown>{insight}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <a href={marketData.results[0]?.permalink} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all text-[10px] font-black uppercase tracking-widest">
                    VER NO MERCADO LIVRE <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                  <Activity className="h-8 w-8 text-white/20 mb-3" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center px-10">Aguardando varredura estratégica</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
