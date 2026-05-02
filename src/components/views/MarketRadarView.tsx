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
  TrendingUp,
  Brain,
  ChevronRight,
  ShieldCheck,
  Target
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { mlService } from "@/services/mercadoLivreService";
import { aiService } from "@/services/aiService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Custom components for Markdown to handle semantic colors (Synced with AIView)
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-black text-white mt-6 mb-3 border-b border-primary/30 pb-2 uppercase tracking-tighter text-glow-cyan">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-black text-white mt-5 mb-2 uppercase tracking-tighter text-glow-cyan">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-black text-primary mt-4 mb-1 uppercase tracking-tighter">{children}</h3>,
  p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-justify text-white/90">{children}</p>,
  ul: ({ children }: any) => <ul className="list-none space-y-2 mb-4">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_5px_rgba(0,163,255,0.8)]" />
      <span className="text-white/90">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => <strong className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{children}</strong>,
  desc: ({ children }: any) => <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 mx-1 uppercase tracking-tighter">{children}</span>,
  price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
  warn: ({ children }: any) => <span className="font-black text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{children}</span>,
  name: ({ children }: any) => <span className="font-black text-white border-b border-white/30 pb-0.5">{children}</span>,
  hr: () => <hr className="my-4 border-white/10" />,
};

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
  }, [isConnected]);

  const handleAuth = async (code: string) => {
    setIsSyncing(true);
    toast.loading("Estabelecendo conexão tática...", { id: 'ml-auth' });
    try {
      const data = await mlService.exchangeCodeForToken(code);
      if (data && data.access_token) {
        await updateAppSetting('ml_access_token', data.access_token);
        await updateAppSetting('ml_refresh_token', data.refresh_token);
        await updateAppSetting('ml_token_expiry', (Date.now() + (data.expires_in * 1000)).toString());
        toast.success("CONEXÃO ESTABELECIDA 🚀", { id: 'ml-auth' });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      toast.error("FALHA NA CONEXÃO 🚨", { id: 'ml-auth' });
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
      let accessToken = appSettings.ml_access_token;
      const expiry = parseInt(appSettings.ml_token_expiry || "0");
      
      // AUTO-REFRESH: Se o token expirou ou expira em menos de 5 min
      if (expiry && Date.now() > (expiry - 300000)) {
        console.log("🔄 Renovando token ML expirado...");
        const refreshData = await mlService.refreshToken(appSettings.ml_refresh_token);
        if (refreshData && refreshData.access_token) {
          accessToken = refreshData.access_token;
          await updateAppSetting('ml_access_token', refreshData.access_token);
          await updateAppSetting('ml_refresh_token', refreshData.refresh_token);
          await updateAppSetting('ml_token_expiry', (Date.now() + (refreshData.expires_in * 1000)).toString());
          toast.success("Conexão renovada automaticamente!");
        } else {
          toast.error("Conexão ML expirada. Por favor, reconecte.");
          setLoadingItems(prev => ({ ...prev, [key]: false }));
          return;
        }
      }
      
      // BUSCA DADOS DE MERCADO (PLATINUM/GOLD)
      let marketInfo = await mlService.getMarketData(item.sku, accessToken);
      if (!marketInfo) {
        marketInfo = await mlService.getMarketData(item.name, accessToken);
      }

      if (!marketInfo) {
        toast.error("Nenhum concorrente direto encontrado para este item.");
        setLoadingItems(prev => ({ ...prev, [key]: false }));
        return;
      }

      setMarketPrices(prev => ({ ...prev, [key]: marketInfo }));
      
      // Get AI Insights based on market data
      const insight = await aiService.getMarketAnalysis(item, marketInfo.results);
      setAiInsights(prev => ({ ...prev, [key]: insight.text }));
      
      toast.success("Varredura tática concluída! 🎯");
    } catch (err) {
      toast.error("Erro na varredura estratégica.");
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 shadow-glow-cyan ring-1 ring-primary/40">
              <Target className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 truncate">MERCADO RADAR</div>
              <div className="text-2xl font-black text-white text-glow-cyan truncate">Varredura de Preço</div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-rose-500 shadow-glow-rose'}`} />
                <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-white/90">
                  {isConnected ? "SISTEMA INTEGRADO ML" : "AGUARDANDO AUTENTICAÇÃO"}
                </div>
              </div>
            </div>
          </div>
          {!isConnected && (
            <button onClick={startLogin} className="shrink-0 h-12 px-6 rounded-2xl bg-primary text-black font-black text-[11px] uppercase tracking-widest shadow-glow-cyan active:scale-95 transition-all">CONECTAR</button>
          )}
        </div>
      </section>

      {/* Busca */}
      <div className="bg-black-piano neon-blue-border-thin flex items-center gap-3 rounded-2xl px-6 py-4 shadow-lg focus-within:neon-blue-border transition-all">
        <Search className="h-5 w-5 text-primary/60" />
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Pesquisar item para análise..." 
          className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white/30" 
        />
      </div>

      <div className="space-y-6">
        {filteredItems.map((item, idx) => {
          const key = item.sku || item.name;
          const marketData = marketPrices[key];
          const insight = aiInsights[key];
          const isLoading = loadingItems[key];
          
          return (
            <motion.div 
              key={key} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }} 
              className="bg-black-piano neon-blue-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex gap-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-black border border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={item.image_url || "/products/placeholder.png"} className="h-full w-full object-cover opacity-80" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight mb-1">{item.name}</h3>
                    <div className="font-mono-tactical text-[11px] text-primary font-black uppercase tracking-widest">SKU: {item.sku || "N/A"}</div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Custo Atual:</span>
                       <span className="font-mono-tactical text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">R$ {item.buy_price || item.cost || 0}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleResearch(item)} 
                  disabled={isLoading} 
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
                    isLoading 
                      ? 'bg-primary/10 text-primary animate-spin' 
                      : 'bg-white/5 text-primary hover:bg-primary hover:text-black shadow-glow-cyan active:scale-90'
                  }`}
                >
                  <RefreshCw className="h-6 w-6" />
                </button>
              </div>

              {marketData ? (
                <div className="space-y-6">
                  {/* Grid de Preços Diretos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] rounded-[1.5rem] p-5 border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Activity className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="font-mono-tactical text-[9px] font-black text-white/40 uppercase mb-2 tracking-widest">MENOR PLATINUM (ML)</div>
                      <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">R$ {marketData.bestPrice}</div>
                      {marketData.isCatalog && (
                        <div className="mt-2 text-[8px] font-black text-emerald-400/70 uppercase tracking-tighter bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 w-fit">
                          DISPUTA DE CATÁLOGO
                        </div>
                      )}
                    </div>
                    <div className="bg-primary/5 rounded-[1.5rem] p-5 border border-primary/20 shadow-glow-cyan/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="font-mono-tactical text-[9px] font-black text-primary/60 uppercase mb-2 tracking-widest">PREÇO PARA GANHAR</div>
                      <div className="text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,163,255,0.3)]">R$ {marketData.suggestedPrice}</div>
                      <div className="mt-2 text-[8px] font-black text-primary/70 uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded border border-primary/20 w-fit">
                        - R$ 2,00 VS LÍDER
                      </div>
                    </div>
                  </div>

                  {/* Insights da IA */}
                  <AnimatePresence>
                    {insight && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="bg-primary/5 border border-primary/20 rounded-[1.5rem] p-6 shadow-glow-cyan/10 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 tactical-grid opacity-5" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Brain className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-mono-tactical text-[11px] font-black text-primary uppercase tracking-[0.2em]">CÉREBRO ANALÍTICO 3.1</span>
                        </div>
                        <div className="relative z-10 prose-ai-insight">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={MarkdownComponents as any}
                          >
                            {insight}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <a 
                    href={marketData.results[0]?.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all text-[11px] font-black uppercase tracking-widest border border-white/10 active:scale-95 shadow-lg"
                  >
                    ANALISAR ANÚNCIO PLATINUM <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-white/20" />
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center px-12">AGUARDANDO VARREDURA ESTRATÉGICA</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
