import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, MessageSquare, Copy, Check, TrendingUp, AlertCircle, Brain, Calendar, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { aiService } from '@/services/aiService';
import ReactMarkdown from 'react-markdown';

interface PredictiveShoppingListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PredictiveShoppingList: React.FC<PredictiveShoppingListProps> = ({ isOpen, onClose }) => {
  const { products, movements } = useStore();
  const [copied, setCopied] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);

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
  }).filter((item: any) => item.stock <= 3 || item.daysRemaining <= 7); // Alerta se estoque baixo ou acaba em 7 dias

  const handleCopy = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    let message = `*📋 LISTA DE REPOSIÇÃO TÁTICA - ${date}*\n`;
    message += `_Oráculo Victor's Smart Estoque_\n\n`;
    
    tacticalList.forEach((item: any) => {
      const priority = item.stock === 0 ? "🚨 CRÍTICO" : item.daysRemaining <= 3 ? "⚠️ URGENTE" : "📦 REPOR";
      message += `*${item.name}* (${item.spec})\n`;
      message += `Stock: ${item.stock} | Giro: ${item.velocity.toFixed(2)}/dia | Esgota em: ${item.daysRemaining === Infinity ? '∞' : item.daysRemaining + ' dias'}\n`;
      message += `Status: ${priority}\n\n`;
    });

    if (aiInsight) {
      message += `*🧠 INSIGHT DA IA:*\n${aiInsight.replace(/###/g, '').replace(/\*\*/g, '*')}`;
    }

    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Lista copiada para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    handleCopy(); // Copia antes de enviar para garantir que o usuário tenha o texto
    const text = encodeURIComponent(generateSimpleMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const generateSimpleMessage = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    let message = `*📋 LISTA DE REPOSIÇÃO - ${date}*\n\n`;
    tacticalList.forEach((item: any) => {
      message += `• ${item.name} (${item.spec}): ${item.stock} un\n`;
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
        <Drawer.Content className="bg-black/95 flex flex-col rounded-t-[32px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 shadow-2xl">
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
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>

              {tacticalList.length > 0 ? (
                <div className="space-y-6">
                  {/* AI INSIGHT SECTION */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Oráculo de Suprimentos</span>
                        </div>
                        {!aiInsight && (
                          <button 
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="text-[9px] font-black text-primary hover:text-white transition-colors flex items-center gap-1 uppercase"
                          >
                            {isAnalysing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                            GERAR INSIGHTS IA
                          </button>
                        )}
                      </div>

                      {aiInsight ? (
                        <div className="prose prose-invert prose-sm max-w-none font-mono-tactical text-[11px] leading-relaxed">
                          <ReactMarkdown>{aiInsight}</ReactMarkdown>
                          <button 
                            onClick={() => setAiInsight(null)}
                            className="mt-4 text-[9px] text-white/20 hover:text-primary transition-colors font-black uppercase tracking-widest"
                          >
                            Recalcular com Novos Dados
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4 text-center">
                          <p className="text-white/30 text-[11px] mb-4">Clique para analisar o giro de estoque e gerar sugestões de compra otimizadas.</p>
                          <Button 
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black font-black text-[10px] rounded-xl px-6"
                          >
                            {isAnalysing ? 'PROCESSANDO...' : 'CONSULTAR INTELIGÊNCIA'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRODUCTS GRID */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Itens em Alerta ({tacticalList.length})</span>
                    </div>
                    
                    {tacticalList.map((item: any, idx) => (
                      <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                        <div className="flex gap-4 items-center">
                          <div className={`w-1 h-10 rounded-full ${item.stock === 0 ? 'bg-danger shadow-glow-ruby' : 'bg-warning shadow-glow-amber'}`} />
                          <div>
                            <div className="text-sm font-black text-white uppercase group-hover:text-primary transition-colors">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-white/30 uppercase font-bold">{item.spec}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span className="text-[10px] text-white/40 font-mono-tactical">Giro: {item.velocity.toFixed(2)}/dia</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-black font-mono-tactical ${item.stock === 0 ? 'text-danger' : 'text-white'}`}>
                            {item.stock} <span className="text-[10px] text-white/30">UN</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-white/20" />
                            <div className={`text-[9px] font-black uppercase tracking-widest ${item.daysRemaining <= 3 ? 'text-danger' : 'text-white/40'}`}>
                              {item.daysRemaining === Infinity ? 'ESTÁVEL' : `ESGOOTA EM ${item.daysRemaining}D`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={handleCopy}
                      className="flex h-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs gap-3 hover:bg-white/10 transition-all uppercase tracking-widest"
                    >
                      {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copiado' : 'Copiar Tudo'}
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
                  <p className="text-white/30 text-sm max-w-xs mx-auto mb-8">Seu estoque está saudável. Nenhuma ruptura crítica detectada pelo Oráculo nas próximas 48h.</p>
                  <Button variant="outline" onClick={onClose} className="border-white/10 text-white/50 rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white">
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
