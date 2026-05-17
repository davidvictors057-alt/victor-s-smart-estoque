import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, MessageSquare, FileText, Check, TrendingUp, AlertCircle, Brain, Calendar, Info, Loader2, CheckSquare, Square, Filter, ChevronDown, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface PredictiveShoppingListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PredictiveShoppingList: React.FC<PredictiveShoppingListProps> = ({ isOpen, onClose }) => {
  const { products, movements } = useStore();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [stockFilter, setStockFilter] = useState<number | 'all'>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // 1. Filtrar saídas dos últimos 30 dias para cálculo de giro
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSales = movements.filter(m => 
    m.type === 'out' && new Date(m.timestamp) > thirtyDaysAgo
  );

  // 2. Agrupar produtos e calcular velocidade
  const inStock = products.filter(p => p.status === 'in_stock');
  const grouped = inStock.reduce((acc: any, p) => {
    const key = `${p.name} ${p.spec || ''}`;
    if (!acc[key]) acc[key] = { name: p.name, spec: p.spec, stock: 0, salesCount: 0 };
    acc[key].stock += 1;
    return acc;
  }, {});

  // Contar vendas para cada grupo
  recentSales.forEach(sale => {
    const product = products.find(p => p.id === sale.product_id);
    if (product) {
      const key = `${product.name} ${product.spec || ''}`;
      if (grouped[key]) {
        grouped[key].salesCount += 1;
      }
    }
  });

  // Calcular métricas finais
  const tacticalList = Object.values(grouped).map((item: any) => {
    const velocity = item.salesCount / 30; // unidades/dia
    const daysRemaining = velocity > 0 ? Math.floor(item.stock / velocity) : Infinity;
    return { ...item, velocity, daysRemaining };
  }).filter((item: any) => item.stock <= 3 || item.daysRemaining <= 7);

  // Filtragem por quantidade de estoque
  const filteredList = tacticalList.filter(item => 
    stockFilter === 'all' || item.stock === stockFilter
  );

  // Inicializar seleção se estiver vazia e a lista carregar
  useEffect(() => {
    if (filteredList.length > 0 && selectedKeys.size === 0) {
      setSelectedKeys(new Set(filteredList.map(i => `${i.name}-${i.spec}`)));
    }
  }, [filteredList.length]);

  const toggleItem = (name: string, spec: string) => {
    const key = `${name}-${spec}`;
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedKeys(newSelected);
  };

  const toggleAll = () => {
    if (selectedKeys.size === filteredList.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredList.map(i => `${i.name}-${i.spec}`)));
    }
  };

  const cleanSpec = (spec: string | null) => {
    if (!spec || spec === 'null' || spec === 'undefined' || spec === 'nu' || spec.trim() === '') return '';
    return spec.trim();
  };

  const handleExport = () => {
    const selectedToInclude = filteredList.filter(i => 
      selectedKeys.has(`${i.name}-${i.spec}`)
    );

    if (selectedToInclude.length === 0) {
      toast.error('Selecione pelo menos um item para exportar');
      return;
    }

    setIsExporting(true);
    const content = generateSimpleMessage();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reposicao-estoque-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Lista exportada com sucesso!');
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleCopy = () => {
    const selectedToInclude = filteredList.filter(i => 
      selectedKeys.has(`${i.name}-${i.spec}`)
    );

    if (selectedToInclude.length === 0) {
      toast.error('Selecione pelo menos um item para copiar');
      return;
    }

    const content = generateSimpleMessage();
    navigator.clipboard.writeText(content);
    toast.success('Lista copiada para a área de transferência');
  };

  const handleWhatsApp = () => {
    handleCopy(); // Copia antes de enviar para garantir que o usuário tenha o texto
    const text = encodeURIComponent(generateSimpleMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const generateSimpleMessage = () => {
    const selectedToInclude = filteredList.filter(i => 
      selectedKeys.has(`${i.name}-${i.spec}`)
    );

    const date = new Date().toLocaleDateString('pt-BR');
    let message = `*📋 LISTA DE REPOSIÇÃO - ${date}*\n\n`;
    
    selectedToInclude.forEach((item: any) => {
      const spec = cleanSpec(item.spec);
      const specText = spec ? ` (${spec})` : '';
      message += `• ${item.name}${specText}: ${item.stock}\n\n`;
    });
    return message;
  };

  const runAIAnalysis = async () => {
    setIsAnalysing(true);
    try {
      const result = await aiService.getShoppingListInsight(tacticalList);
      setAiInsight(result.text);
      toast.success('Análise do Oráculo concluída!');
    } catch (error) {
      toast.error('Erro ao consultar a IA');
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-black/95 flex flex-col rounded-t-[32px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
            
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow-cyan/20">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Lista Preditiva</h2>
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">Intelligence Mode Active</p>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {tacticalList.length > 0 ? (
                <div className="space-y-6">
                  {/* AI INSIGHT SECTION */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Oráculo de Suprimentos</span>
                        </div>
                        {!aiInsight && (
                          <button 
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="text-[9px] font-black text-primary hover:text-white transition-colors flex items-center gap-1 uppercase bg-primary/10 px-2 py-1 rounded-md"
                          >
                            {isAnalysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                            GERAR INSIGHTS IA
                          </button>
                        )}
                      </div>

                      {aiInsight ? (
                        <div className="prose prose-invert prose-sm max-w-none font-mono-tactical text-[11px] leading-relaxed text-justify text-white">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              h1: ({ children }: any) => <h1 className="text-xs font-black text-white mt-5 mb-3 border-b border-primary/30 pb-2 uppercase tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,255,240,0.5)] flex items-center gap-2">{children}</h1>,
                              h2: ({ children }: any) => <h2 className="text-[11px] font-black text-white mt-4 mb-2 uppercase tracking-tighter text-primary drop-shadow-[0_0_6px_rgba(0,255,240,0.4)] flex items-center gap-2">{children}</h2>,
                              h3: ({ children }: any) => <h3 className="text-[10px] font-black text-primary mt-4 mb-1 uppercase tracking-tighter flex items-center gap-2 drop-shadow-[0_0_4px_rgba(0,255,240,0.3)]">{children}</h3>,
                              p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed text-justify text-white/95">{children}</p>,
                              ul: ({ children }: any) => <ul className="list-none space-y-1.5 my-3 pl-1">{children}</ul>,
                              li: ({ children }: any) => (
                                <li className="flex items-start gap-2 text-[10px]">
                                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0 shadow-[0_0_5px_rgba(0,255,240,0.8)]" />
                                  <span className="text-white/80">{children}</span>
                                </li>
                              ),
                              strong: ({ children }: any) => <strong className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.25)]">{children}</strong>,
                              table: ({ children }: any) => (
                                <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-black/40">
                                  <table className="w-full text-left text-[10px]">{children}</table>
                                </div>
                              ),
                              thead: ({ children }: any) => <thead className="bg-white/5 border-b border-white/10">{children}</thead>,
                              th: ({ children }: any) => <th className="bg-white/10 p-2 font-black uppercase tracking-widest border-b border-white/10 text-primary">{children}</th>,
                              td: ({ children }: any) => <td className="p-2 border-b border-white/5 text-white font-bold">{children}</td>,
                              warn: ({ children }: any) => <span className="font-black text-danger uppercase tracking-tight px-1.5 py-0.5 rounded-sm bg-danger/10 border border-danger/20 inline-block text-[9px] drop-shadow-[0_0_5px_rgba(239,68,68,0.4)] animate-pulse">{children}</span>,
                              price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
                              desc: ({ children }: any) => <span className="text-[10px] font-bold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 mx-1 uppercase tracking-tighter">{children}</span>,
                              name: ({ children }: any) => <span className="font-black text-white border-b border-white/30 pb-0.5">{children}</span>,
                            } as any}
                          >
                            {aiInsight}
                          </ReactMarkdown>
                          <button 
                            onClick={() => setAiInsight(null)}
                            className="mt-4 text-[9px] text-white hover:text-primary transition-colors font-black uppercase tracking-widest"
                          >
                            Recalcular com Novos Dados
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4 text-center">
                          <p className="text-white font-black text-[11px] mb-4 tracking-tight">Clique para analisar o giro de estoque e gerar sugestões de compra otimizadas.</p>
                          <Button 
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="bg-primary text-black hover:bg-primary/90 font-black text-[10px] rounded-xl px-6 h-10 shadow-glow-cyan/20"
                          >
                            {isAnalysing ? 'PROCESSANDO...' : 'CONSULTAR INTELIGÊNCIA'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Filter className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Filtrar Estoque</span>
                      </div>
                      <div className="flex gap-2">
                        {['all', 0, 1, 2, 3].map((val) => (
                          <button
                            key={val}
                            onClick={() => setStockFilter(val as any)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-[10px] font-black transition-all border uppercase tracking-tighter",
                              stockFilter === val 
                                ? "bg-primary border-primary text-black shadow-glow-cyan/20" 
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            )}
                          >
                            {val === 'all' ? 'Todos' : `${val} un`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1 py-2 border-y border-white/5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest italic">
                          {stockFilter === 'all' ? 'Itens em Alerta' : `Estoque ${stockFilter} UN`} ({filteredList.length})
                        </span>
                      </div>
                      <button 
                        onClick={toggleAll}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      >
                        {selectedKeys.size === filteredList.length && filteredList.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-white" />
                        )}
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                          {selectedKeys.size === filteredList.length && filteredList.length > 0 ? 'Desmarcar' : 'Ticar Tudo'}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 pb-32">
                    {filteredList.map((item: any, idx) => {
                      const isSelected = selectedKeys.has(`${item.name}-${item.spec}`);
                      const spec = cleanSpec(item.spec);
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => toggleItem(item.name, item.spec)}
                          className={cn(
                            "bg-white/[0.03] border rounded-2xl p-4 flex items-center justify-between group transition-all cursor-pointer",
                            isSelected ? "border-primary/40 bg-primary/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex gap-4 items-center">
                            <div className="flex items-center justify-center">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shadow-glow-cyan/40">
                                  <Check className="w-3.5 h-3.5 text-black" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border-2 border-white/20 group-hover:border-white/40" />
                              )}
                            </div>
                            <div className={`w-1 h-10 rounded-full ${item.stock === 0 ? 'bg-red-500 shadow-glow-ruby/40' : 'bg-orange-400 shadow-glow-amber/40'}`} />
                            <div>
                              <div className={cn(
                                "text-sm font-black uppercase transition-colors tracking-tight",
                                isSelected ? "text-primary" : "text-white"
                              )}>
                                {item.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {spec && <span className="text-[10px] text-white uppercase font-black">{spec}</span>}
                                {spec && <span className="w-1 h-1 rounded-full bg-white/50" />}
                                <span className="text-[10px] text-white font-mono-tactical tracking-tighter font-bold">Giro: {item.velocity.toFixed(2)}/dia</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-lg font-black font-mono-tactical tracking-tighter",
                              item.stock === 0 ? "text-red-500" : isSelected ? "text-primary" : "text-white"
                            )}>
                              {item.stock} <span className="text-[10px] opacity-100 font-bold uppercase">UN</span>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <Calendar className="w-3 h-3 text-white" />
                              <div className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                item.daysRemaining <= 3 ? "text-red-500" : "text-white"
                              )}>
                                {item.daysRemaining === Infinity ? 'ESTÁVEL' : `${item.daysRemaining}D`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 p-6 grid grid-cols-2 gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <button 
                      onClick={handleExport}
                      className="flex h-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs gap-3 hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      {isExporting ? <Check className="w-5 h-5 text-success" /> : <FileText className="w-5 h-5" />}
                      {isExporting ? 'Exportado' : 'Exportar TXT'}
                    </button>
                    <button 
                      onClick={handleWhatsApp}
                      className="flex h-14 items-center justify-center rounded-2xl bg-green-600 text-white font-black text-xs gap-3 hover:bg-green-500 transition-all uppercase tracking-widest shadow-glow-green/20"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Enviar Zap
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-success/20 animate-ping opacity-20" />
                    <Check className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">Logística em Dia</h3>
                  <p className="text-white text-sm max-w-xs mx-auto mb-8 font-bold">Seu estoque está saudável. Nenhuma ruptura crítica detectada pelo Oráculo nas próximas 48h.</p>
                  <Button variant="outline" onClick={onClose} className="border-white/10 text-white rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white">
                    Fechar Terminal
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
