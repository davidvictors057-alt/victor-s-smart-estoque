import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { aiService } from '@/services/aiService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Brain, TrendingDown, Package, User, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface AIProductInsightProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export const AIProductInsight: React.FC<AIProductInsightProps> = ({ product, isOpen, onClose }) => {
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      fetchInsight();
    }
  }, [isOpen, product]);

  const fetchInsight = async () => {
    setIsLoading(true);
    setInsight('');
    try {
      // Buscar histórico de 15 dias do produto
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const { data: history, error } = await supabase
        .from('movements')
        .select('*')
        .eq('product_id', product.id)
        .gte('created_at', fifteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const response = await aiService.getProductInsight(product.name, history || []);
      setInsight(response.text || 'Não foi possível gerar a análise.');
    } catch (error) {
      console.error('Error fetching AI insight:', error);
      toast.error('Erro ao conectar com o Oráculo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-[#0f172a] flex flex-col rounded-t-[20px] h-[70vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10">
          <div className="p-4 bg-[#0f172a] rounded-t-[20px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mb-8" />
            
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Brain className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">Oráculo Operacional</h2>
                    <p className="text-xs text-blue-400 font-medium tracking-wider uppercase">Análise de Giro de 15 Dias</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-blue-500 animate-spin" />
                    <Brain className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-white text-sm animate-pulse font-medium">Consultando Cérebro Central...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Produto Selecionado</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{product?.name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-white">Estoque: {product?.stock}un</span>
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none ai-insight-content">
                    <ReactMarkdown
                      components={{
                        hr: () => <hr className="my-6 border-white/10" />,
                        p: ({children}) => <p className="text-white/90 leading-relaxed text-[13px] mb-4 text-justify">{children}</p>,
                        strong: ({children}) => <strong className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{children}</strong>,
                        h1: ({children}) => <h1 className="text-lg font-black text-white mb-3 uppercase tracking-tighter text-glow-ai border-b border-white/5 pb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-md font-black text-white mb-2 uppercase tracking-tighter">{children}</h2>,
                        ul: ({children}) => <ul className="space-y-3 mb-6">{children}</ul>,
                        li: ({children}) => (
                          <li className="text-[13px] text-white/90 flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-ai shadow-glow-ai mt-1.5 flex-shrink-0" />
                            {children}
                          </li>
                        ),
                        // Semantic Tags (Price/Warn/Desc)
                        price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
                        warn: ({ children }: any) => <span className="font-black text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{children}</span>,
                        desc: ({ children }: any) => <span className="text-[10px] font-bold text-ai/80 bg-ai/5 px-1.5 py-0.5 rounded border border-ai/20 mx-1 uppercase tracking-tighter">{children}</span>,
                      } as any}
                    >
                      {insight}
                    </ReactMarkdown>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 rounded-xl"
                      onClick={() => {
                         const text = `Oi, o Oráculo avisou que o item *${product?.name}* precisa de atenção.
Giro de 15 dias: ${product?.stock} em estoque.
Resumo: ${insight.split('\n')[0]}`;
                         window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                    >
                      Compilado p/ Patrão
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl shadow-lg shadow-blue-900/20"
                      onClick={onClose}
                    >
                      Entendido
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
