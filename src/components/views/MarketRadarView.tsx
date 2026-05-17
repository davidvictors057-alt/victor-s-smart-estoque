import { useState, useEffect, useMemo } from "react";
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
  Target,
  Globe,
  Clock
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { aiService } from "@/services/aiService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { sortSearchResults } from "@/lib/searchUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Custom components for Markdown to handle semantic colors
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-black text-white mt-8 mb-4 border-l-4 border-primary pl-4 uppercase tracking-tighter">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold text-primary/90 mt-6 mb-3 uppercase tracking-tight">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-bold text-white/70 mt-5 mb-2 uppercase tracking-widest text-[11px]">{children}</h3>,
  p: ({ children }: any) => (
    <p className="mb-6 leading-[1.8] text-white/80 text-[13px] font-medium text-justify hyphens-auto break-words whitespace-pre-line">
      {children}
    </p>
  ),
  ul: ({ children }: any) => <ul className="list-none space-y-3 mb-6 ml-1">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-3">
      <div className="mt-2 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
      <span className="text-white/80 text-[13px] leading-relaxed">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => <strong className="font-black text-white px-1 rounded bg-white/5">{children}</strong>,
  desc: ({ children }: any) => <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 mx-1 uppercase">{children}</span>,
  price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded">{children}</span>,
  warn: ({ children }: any) => <span className="font-bold text-amber-400 border-b border-amber-400/30 pb-0.5">{children}</span>,
  name: ({ children }: any) => <span className="font-black text-primary border-b border-primary/30">{children}</span>,
  hr: () => <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />,
};

export const MarketRadarView = () => {
  const [query, setQuery] = useState("");
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [marketPrices, setMarketPrices] = useState<Record<string, { price: number; link: string; lastSync?: string }>>({});
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const { products, fetchProducts, currentUser } = useStore();

  // Initialize marketPrices and aiInsights from database/localStorage
  useEffect(() => {
    if (products?.length) {
      const prices: Record<string, any> = {};
      const savedInsights = localStorage.getItem('nexus_oracle_insights');
      const parsedInsights = savedInsights ? JSON.parse(savedInsights) : {};
      
      products.forEach(p => {
        if (p.market_price) {
          const key = p.name.toLowerCase();
          prices[key] = {
            price: p.market_price,
            link: "#", 
            lastSync: p.last_radar_sync
          };
        }
      });
      setMarketPrices(prices);
      setAiInsights(parsedInsights);
    }
  }, [products]);

  const items = (products || [])
    .filter(p => p.status === 'in_stock')
    .reduce((acc, p) => {
      const key = p.name.toLowerCase();
      if (!acc[key]) {
        acc[key] = { ...p, stock: 0 };
      }
      acc[key].stock += 1;
      return acc;
    }, {} as Record<string, any>);

  const filteredItems = useMemo(() => {
    return sortSearchResults(Object.values(items), query);
  }, [items, query]);

  const handleResearch = async (item: any) => {
    const key = item.name.toLowerCase();
    setLoadingItems(prev => ({ ...prev, [key]: true }));
    
    try {
      toast.loading(`Iniciando varredura para ${item.name}...`, { id: 'market-scan' });
      
      // 1. BUSCA PREÇO DE MERCADO VIA IA COM GROUNDING
      const marketResult = await aiService.getMarketPrice(item.name);
      
      if (!marketResult || !marketResult.price) {
        toast.error("IA não conseguiu determinar um preço de mercado confiável.", { id: 'market-scan' });
        return;
      }

      // 2. PERSISTÊNCIA NO SUPABASE
      const lastSync = new Date().toISOString();
      const clientId = currentUser?.client_id;

      // Atualizar todos os produtos com o mesmo nome para manter sincronia
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          market_price: marketResult.price,
          last_radar_sync: lastSync,
          updated_at: lastSync
        })
        .match({ 
          name: item.name,
          client_id: clientId
        });

      if (updateError) {
        console.error("Erro ao persistir dados de mercado:", updateError);
        toast.error("Erro ao salvar dados no banco.", { id: 'market-scan' });
      }

      // 3. ANÁLISE ESTRATÉGICA (NEXUS ORACLE)
      const analysis = await aiService.getMarketAnalysis(item, marketResult.price, currentUser?.full_name);
      
      // 4. ATUALIZAÇÃO DE ESTADO
      setMarketPrices(prev => ({ 
        ...prev, 
        [key]: { 
          price: marketResult.price, 
          link: marketResult.link,
          lastSync: lastSync
        } 
      }));
      setAiInsights(prev => {
        const next = { ...prev, [key]: analysis.text };
        localStorage.setItem('nexus_oracle_insights', JSON.stringify(next));
        return next;
      });
      
      // Refresh products from store to sync across UI
      await fetchProducts();
      
      toast.success("VARREDURA TÁTICA CONCLUÍDA! 🎯", { id: 'market-scan' });
    } catch (err) {
      console.error("Erro na varredura estratégica:", err);
      toast.error("FALHA NA VARREDURA ESTRATÉGICA 🚨", { id: 'market-scan' });
    } finally {
      setLoadingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col">

      <div className="space-y-6 px-3 pb-32">
      {/* Header Tático Refatorado */}
      <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl">
        <div className="absolute inset-0 tactical-grid opacity-20" />
        <div className="relative flex flex-row items-center justify-between gap-4 min-h-[80px]">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 shadow-glow-cyan ring-1 ring-primary/40">
              <Target className="h-7 w-7 text-primary animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 truncate">NEXUS ORACLE</div>
              <div className="text-2xl font-black text-white text-glow-cyan truncate">Sentinela de Mercado</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full shrink-0 bg-emerald-500 shadow-glow-emerald" />
                <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-white/90">
                  ORÁCULO: ATIVO (ESTRATEGIA DE DOMINÂNCIA)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Busca */}
      <div className="bg-black-piano neon-blue-border-thin flex items-center gap-3 rounded-2xl px-6 py-4 shadow-lg focus-within:neon-blue-border transition-all">
        <Search className="h-5 w-5 text-primary/60" />
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Pesquisar item para varredura tática..." 
          className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white/30" 
        />
      </div>

      <div className="space-y-6">
        {filteredItems.map((item, idx) => {
          const key = item.name.toLowerCase();
          const marketData = marketPrices[key];
          const insight = aiInsights[key];
          const isLoading = loadingItems[key];
          const lastSync = marketData?.lastSync || item.last_radar_sync;
          
          return (
            <motion.div 
              key={key} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }} 
              className="bg-black-piano neon-blue-border rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="flex flex-col gap-4 mb-6">
                {/* Info do Produto */}
                <div className="flex gap-4 items-start">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black border border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src={item.image_url || "/products/placeholder.png"} className="h-full w-full object-cover opacity-80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-white leading-tight mb-1 break-words">{item.name}</h3>
                    <div className="font-mono-tactical text-[10px] text-primary font-black uppercase tracking-widest flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>SKU: {item.sku || "N/A"}</span>
                      {lastSync && (
                        <span className="flex items-center gap-1 text-white/30 lowercase tracking-normal font-bold">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(lastSync), "dd MMM, HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custo Atual e Botão de Varredura */}
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 xs:p-3 gap-2">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <span className="text-[9px] xs:text-[10px] font-black text-white/40 uppercase tracking-tighter">Custo Atual:</span>
                    <span className="font-mono-tactical text-[11px] xs:text-xs font-black text-white bg-white/5 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg border border-white/10 whitespace-nowrap">
                      R$ {item.cost || 0}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleResearch(item)} 
                    disabled={isLoading} 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] xs:text-xs font-black uppercase tracking-wider transition-all select-none active:scale-95 shrink-0 ${
                      isLoading 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-primary text-black hover:bg-primary/95 shadow-glow-cyan'
                    }`}
                  >
                    <RefreshCw className={`h-3 w-3 xs:h-3.5 xs:w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? "Varrendo..." : "Varrer"}</span>
                  </button>
                </div>
              </div>

              {marketData ? (
                <div className="space-y-6">
                  {/* Grid de Preços Diretos */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/[0.03] rounded-[1.5rem] p-3.5 xs:p-4 sm:p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <Globe className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-mono-tactical text-[8px] xs:text-[9px] font-black text-white/40 uppercase mb-1 tracking-widest">MENOR MERCADO (IA)</div>
                        <div className="flex flex-wrap items-baseline gap-0.5 text-lg xs:text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                          <span className="text-[10px] font-black text-emerald-400/60 mr-0.5">R$</span>
                          <span className="font-mono-tactical">{marketData.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[7px] xs:text-[8px] font-black text-emerald-400/70 uppercase tracking-tighter bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 w-fit whitespace-nowrap">
                        PREÇO À VISTA / PIX
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 rounded-[1.5rem] p-3.5 xs:p-4 sm:p-5 border border-primary/20 shadow-glow-cyan/10 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono-tactical text-[8px] xs:text-[9px] font-black text-primary/60 uppercase mb-1 tracking-widest">SUGESTÃO DE VENDA</div>
                        <div className="flex flex-wrap items-baseline gap-0.5 text-lg xs:text-xl sm:text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(0,163,255,0.3)]">
                          <span className="text-[10px] font-black text-primary/60 mr-0.5">R$</span>
                          <span className="font-mono-tactical">{(marketData.price - 5).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[7px] xs:text-[8px] font-black text-primary/70 uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded border border-primary/20 w-fit whitespace-nowrap">
                        - R$ 5,00 VS MERCADO
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
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-glow-cyan/5">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-mono-tactical text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">RELATÓRIO ESTRATÉGICO</span>
                            <span className="font-mono-tactical text-[12px] font-black text-white uppercase tracking-[0.1em]">ORÁCULO NEXUS v3.1</span>
                          </div>
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

                  {marketData.link && marketData.link !== "#" && (
                    <a 
                      href={marketData.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all text-[11px] font-black uppercase tracking-widest border border-white/10 active:scale-95 shadow-lg"
                    >
                      VER EVIDÊNCIA NO GOOGLE SHOPPING <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-white/20" />
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] text-center px-12">AGUARDANDO VARREDURA ESTRATÉGICA</p>
                  <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-2">IA GROUNDING POWERED</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);
};
