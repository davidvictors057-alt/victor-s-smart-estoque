import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Package, TrendingUp, AlertCircle, Sparkles, MessageSquare, Brain } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface AIProductInsightProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const AIProductInsight: React.FC<AIProductInsightProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const [lastProductId, setLastProductId] = useState<string | null>(null);

  // Buscar dados atualizados do store para garantir persistência e evitar flickering
  const storeProducts = useStore(state => state.products);
  const currentProduct = storeProducts.find(p => p.id === product?.id) || product;

  useEffect(() => {
    if (isOpen && currentProduct) {
      // Se mudou o produto ou abriu agora
      if (currentProduct.id !== lastProductId) {
        setLastProductId(currentProduct.id);
        
        if (currentProduct.market_analysis) {
          setInsight(currentProduct.market_analysis);
        } else {
          setInsight('');
          generateInsight();
        }
      } else if (!insight && currentProduct.market_analysis) {
        // Se o ID é o mesmo mas a análise chegou agora (vinda de outra unidade do mesmo modelo)
        setInsight(currentProduct.market_analysis);
      }
    }
  }, [isOpen, currentProduct, lastProductId, insight]);

  const generateInsight = async () => {
    setIsLoading(true);
    try {
      // Filtrar últimos 90 dias para o Oráculo ter contexto real de giro
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      let query = supabase
        .from('movements')
        .select('*, products!inner(name, spec)')
        .eq('products.name', product.name)
        .gte('timestamp', ninetyDaysAgo.toISOString())
        .order('timestamp', { ascending: false });

      // Tratamento tático para especificações nulas ou genéricas (N/A, Padrão)
      if (product.spec && product.spec !== 'Padrão' && product.spec !== 'N/A') {
        query = query.eq('products.spec', product.spec);
      } else {
        query = query.or(`spec.is.null,spec.eq.Padrão,spec.eq.N/A`, { foreignTable: 'products' });
      }

      const { data: history, error } = await query;

      if (error) throw error;
      
      const { currentUser } = useStore.getState();
      const result = await aiService.getProductInsight(product, history || [], currentUser);
      
      const sanitizeResponse = (text: string) => {
        if (!text) return "";
        
        // Normalização agressiva para estética Black Piano e integridade de tags
        let sanitized = text
          .replace(/\r\n/g, '\n')
          // Remover blocos de código markdown que a IA possa ter deixado
          .replace(/```[a-z]*\n?/gi, '')
          .replace(/```/g, '')
          // Remover negritos/itálicos que envolvem tags (causa de "código no nome")
          .replace(/\*\*<(\w+)>(.*?)<\/\1>\*\*/g, '<$1>$2</$1>')
          .replace(/\*<(\w+)>(.*?)<\/\1>\*/g, '<$1>$2</$1>')
          // Colapsar quebras excessivas
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\n(?!\n)/g, '\n\n') 
          // Limpar espaços internos de tags para evitar quebra de parser
          .replace(/<(\w+)>\s+/g, '<$1>')
          .replace(/\s+<\/(\w+)>/g, '</$2>');

        // Converter tags customizadas em spans tratáveis pelo ReactMarkdown + rehypeRaw
        sanitized = sanitized
          .replace(/<price>(.*?)<\/price>/gi, '<span class="ai-tag-price">$1</span>')
          .replace(/<warn>(.*?)<\/warn>/gi, '<span class="ai-tag-warn">$1</span>')
          .replace(/<name>(.*?)<\/name>/gi, '<span class="ai-tag-name">$1</span>');

        return sanitized.trim();
      };
      
      const sanitizedText = sanitizeResponse(result.text);
      setInsight(sanitizedText);

      // Persistir no store global para todas as unidades desse modelo
      const { updateProductsBulk, products } = useStore.getState();
      const cleanProductName = product.name?.replace(/<.*?>/g, '') || '';
      const relatedIds = products
        .filter(p => p.name === product.name && (p.spec === product.spec || (!p.spec && !product.spec)))
        .map(p => p.id);

      if (relatedIds.length > 0) {
        await updateProductsBulk(relatedIds, { market_analysis: sanitizedText });
      }
    } catch (error) {
      console.error('Error fetching AI insight:', error);
      setInsight('Falha na conexão com o Oráculo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className="fixed inset-0 z-[101] flex flex-col bg-[#050505] text-white animate-in zoom-in-95 duration-300 sm:max-w-none outline-none">
          
          {/* Header Fixo */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">
                  Oráculo Operacional
                </Dialog.Title>
                <Dialog.Description className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                  Análise de Giro de 90 Dias
                </Dialog.Description>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Área Rolável */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-blue-900/5">
            <div className="max-w-3xl mx-auto p-6 space-y-8">
              
              {/* Card do Produto */}
              <div className="relative group p-6 rounded-3xl bg-white/[0.03] border border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white truncate mb-2 uppercase tracking-tight">
                      {product?.name?.replace(/<.*?>/g, '')}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Estoque: {product?.stock} un</span>
                      </div>
                      {product?.price && (
                        <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">R$ {product.price}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-white/40 uppercase tracking-[0.3em] font-medium animate-pulse">
                    Consultando Oráculo...
                  </p>
                </div>
              ) : (
                <div className="prose-ai-insight pb-12">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <p className="text-[15px] text-white/80 leading-[1.8] mb-8 text-justify tracking-wide font-light last:mb-0">{children}</p>,
                      strong: ({children}) => <strong className="font-black text-white border-b border-blue-500/50 pb-0.5">{children}</strong>,
                      h3: ({children}) => <h3 className="text-xl font-black text-white mt-16 mb-8 border-l-[6px] border-blue-600 pl-6 uppercase tracking-tighter">{children}</h3>,
                      ul: ({children}) => <ul className="list-none space-y-6 mb-12 ml-1">{children}</ul>,
                      li: ({children}) => (
                        <li className="flex items-start gap-6">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] mt-2.5 flex-shrink-0" />
                          <div className="flex-1 text-[15px] text-white/90 leading-relaxed text-justify">{children}</div>
                        </li>
                      ),
                      span: ({ node, children, ...props }: any) => {
                        if (props.className === 'ai-tag-price') {
                          return <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 font-black text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)] whitespace-nowrap">{children}</span>;
                        }
                        if (props.className === 'ai-tag-warn') {
                          return <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 font-black text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)] whitespace-nowrap">{children}</span>;
                        }
                        if (props.className === 'ai-tag-name') {
                          return <span className="text-blue-200 font-black border-b border-blue-500/30 pb-0.5 uppercase tracking-wider">{children}</span>;
                        }
                        return <span {...props}>{children}</span>;
                      }
                    } as any}
                  >
                    {insight.replace(/Saudação: /gi, '')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="p-6 border-t border-white/5 bg-black/60 backdrop-blur-xl shrink-0">
            <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                onClick={() => {
                   const text = `Oi, o Oráculo Operacional avisou que o item *${product?.name}* precisa de atenção.
Giro de 15 dias: ${product?.stock} em estoque.
Resumo: ${insight.split('\n')[0]}`;
                   window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Compilado p/ Patrão
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-2xl shadow-xl shadow-blue-900/20 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                onClick={onClose}
              >
                Entendido
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
