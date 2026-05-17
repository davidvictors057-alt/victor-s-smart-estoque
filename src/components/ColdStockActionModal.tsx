import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { useStore, type Product } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import {
  Boxes,
  X,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Brain,
  Calendar,
  Loader2,
  Filter,
  Sparkles,
  DollarSign,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { aiService } from "@/services/aiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface ColdStockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColdStockActionModal: React.FC<ColdStockActionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products } = useStore();
  const [daysThreshold, setDaysThreshold] = useState<number>(30);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter products in stock
  const inStockProducts = products.filter((p) => p.status === "in_stock");

  // Calculate inactivity for each product
  const getProductAge = (p: Product) => {
    const lastUpdate = p.updated_at || p.created_at ? new Date(p.updated_at || p.created_at) : new Date();
    const timeDiff = new Date().getTime() - lastUpdate.getTime();
    return isNaN(timeDiff) ? 1 : Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  // Cold products based on active threshold
  const coldProducts = inStockProducts.filter(
    (p) => getProductAge(p) >= daysThreshold
  );

  // If cold products count is 0, we fallback to showing the oldest products in stock for high fidelity interaction
  const isFallbackActive = coldProducts.length === 0;
  const displayProducts = isFallbackActive
    ? [...inStockProducts]
        .sort((a, b) => getProductAge(b) - getProductAge(a)) // oldest first (largest age)
        .slice(0, 5)
    : coldProducts;

  // Calculate total locked cost
  const totalLockedValue = displayProducts.reduce(
    (sum, p) => sum + (p.cost || 0),
    0
  );

  const cleanSpec = (spec: string | null) => {
    if (
      !spec ||
      spec === "null" ||
      spec === "undefined" ||
      spec === "nu" ||
      spec.trim() === ""
    )
      return "";
    return spec.trim();
  };

  // Generate AI clearance action plan
  const runAIAnalysis = async () => {
    setIsAnalysing(true);
    try {
      const itemsList = displayProducts
        .map(
          (p) =>
            `- ${p.name} (${cleanSpec(p.spec)}): Custo R$ ${p.cost.toFixed(
              2
            )} | Venda R$ ${p.sale.toFixed(2)} | Parado há: ${getProductAge(p)} dias`
        )
        .join("\n");

      const prompt = `Você é o Oráculo de Escoamento da Smart Estoque. Analise estes produtos do estoque frio ou que estão parados há mais tempo e elabore um PLANO DE QUEIMA E ESCOAMENTO ACELERADO TÁTICO.

PRODUTOS SELECIONADOS:
${itemsList}

ESTRUTURA OBRIGATÓRIA:
# 🚀 PLANO TÁTICO DE ESCOAMENTO
(Breve diagnóstico de capital preso e liquidez necessária)

# 💸 PRECIFICAÇÃO E DESCONTOS
(Sugira uma margem agressiva de desconto por modelo. Ex: de R$ X por R$ Y, estimando o novo lucro)

# 📦 CRIAÇÃO DE COMBOS (KITS)
(Ideias de vendas casadas combinando esses aparelhos com acessórios ou serviços)

# 📢 CÓPIA DE DIVULGAÇÃO (BROADCAST)
(Gere uma copy altamente persuasiva e direta para envio em massa no WhatsApp para compradores/clientes finais)`;

      const result = await aiService.chat(prompt);
      setAiPlan(result.text);
      toast.success("Plano de Escoamento IA compilado!");
    } catch (error) {
      toast.error("Falha ao se conectar com o Oráculo de IA.");
    } finally {
      setIsAnalysing(false);
    }
  };

  // Format and share clearance list to WhatsApp
  const handleWhatsAppShare = () => {
    const date = new Date().toLocaleDateString("pt-BR");
    let message = `*🔥 OPORTUNIDADES EXCLUSIVAS DE LIMPA ESTOQUE - ${date} *\n\n`;

    displayProducts.forEach((p) => {
      const age = getProductAge(p);
      const spec = cleanSpec(p.spec);
      const specText = spec ? ` (${spec})` : "";
      // Suggest 10% off as automatic clearance price
      const clearancePrice = (p.sale * 0.9).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      message += `• *${p.name}${specText}*\n`;
      message += `  De: ~R$ ${p.sale.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}~\n`;
      message += `  *Por: R$ ${clearancePrice}* 🚀 (À vista/Pix)\n`;
      message += `  _Últimas unidades paradas há ${age} dias!_\n\n`;
    });

    message += `👉 Aproveite antes que acabe! Entre em contato para fechar o pedido.`;

    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("Lista de liquidação enviada para o WhatsApp!");
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
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-glow-cyan/20 animate-pulse">
                    <Boxes className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                      Estoque Frio (&gt;30 Dias)
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">
                        Tactical Clearance Console
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {displayProducts.length > 0 ? (
                <div className="space-y-6">
                  {/* Dynamic Threshold Selector */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-primary" />
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">
                        Filtro de Inatividade
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[15, 30, 45].map((days) => (
                        <button
                          key={days}
                          onClick={() => {
                            setDaysThreshold(days);
                            setAiPlan(null); // Clear old plan
                          }}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-[10px] font-black transition-all border uppercase tracking-tighter",
                            daysThreshold === days
                              ? "bg-primary border-primary text-black shadow-glow-cyan/20"
                              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          )}
                        >
                          {days} Dias
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fallback & Metrics Alert */}
                  <div
                    className={cn(
                      "border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4",
                      isFallbackActive
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                        : "border-cyan-500/20 bg-cyan-500/5 text-primary"
                    )}
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="w-6 h-6 flex-shrink-0" />
                      <div>
                        {isFallbackActive ? (
                          <>
                            <h4 className="text-sm font-black uppercase tracking-tight text-white">
                              Estoque Super Aquecido! 🔥
                            </h4>
                            <p className="text-white text-[11px] font-bold leading-normal mt-1">
                              Nenhuma unidade está inativa há mais de {daysThreshold} dias. Abaixo estão listadas as 5 unidades com maior tempo de prateleira para ações preventivas.
                            </p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-sm font-black uppercase tracking-tight text-white">
                              Itens Inativos Encontrados
                            </h4>
                            <p className="text-white text-[11px] font-bold leading-normal mt-1">
                              Identificamos {coldProducts.length} itens parados há mais de {daysThreshold} dias. Libere capital de giro com urgência.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-center md:text-right shrink-0 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/50">
                        Custo Preso
                      </div>
                      <div className="text-lg font-black text-white font-mono-tactical">
                        R$ {totalLockedValue.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  {/* AI ORACLE PLAN */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            IA Oráculo - Assistente de Escoamento
                          </span>
                        </div>
                        {!aiPlan && (
                          <button
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="text-[9px] font-black text-primary hover:text-white transition-colors flex items-center gap-1 uppercase bg-primary/10 px-2.5 py-1 rounded-md"
                          >
                            {isAnalysing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            GERAR ESTRATÉGIA IA
                          </button>
                        )}
                      </div>

                      {aiPlan ? (
                        <div className="prose prose-invert prose-sm max-w-none font-mono-tactical text-[11px] leading-relaxed text-justify text-white">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-4 last:mb-0 font-bold text-white leading-relaxed">
                                  {children}
                                </p>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4 rounded-xl border border-white/10 bg-black/40">
                                  <table className="w-full text-left text-[10px]">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="bg-white/10 p-2 font-black uppercase tracking-widest border-b border-white/10 text-primary">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="p-2 border-b border-white/5 text-white font-bold">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {aiPlan}
                          </ReactMarkdown>
                          <button
                            onClick={() => setAiPlan(null)}
                            className="mt-4 text-[9px] text-white hover:text-primary transition-colors font-black uppercase tracking-widest border-b border-white/20 pb-0.5"
                          >
                            Gerar Novo Plano
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4 text-center">
                          <p className="text-white font-black text-[11px] mb-4 tracking-tight">
                            Clique para obter um plano estratégico completo de promoções, descontos inteligentes e combos.
                          </p>
                          <Button
                            onClick={runAIAnalysis}
                            disabled={isAnalysing}
                            className="bg-primary text-black hover:bg-primary/90 font-black text-[10px] rounded-xl px-6 h-10 shadow-glow-cyan/20"
                          >
                            {isAnalysing ? "PROCESSANDO..." : "CONSULTAR INTELIGÊNCIA"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List of Products */}
                  <div className="space-y-3 pb-32">
                    <div className="flex items-center gap-2 px-1">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        Lista de Acompanhamento
                      </span>
                    </div>

                    {displayProducts.map((p, idx) => {
                      const spec = cleanSpec(p.spec);
                      const age = getProductAge(p);

                      return (
                        <div
                          key={p.id || idx}
                          className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-white/10 hover:bg-white/[0.05] transition-all"
                        >
                          <div className="flex gap-4 items-center">
                            <div
                              className={cn(
                                "w-1 h-10 rounded-full",
                                age >= 30
                                  ? "bg-red-500 shadow-glow-ruby/40"
                                  : "bg-cyan-400 shadow-glow-cyan/40"
                              )}
                            />
                            <div>
                              <div className="text-sm font-black uppercase text-white tracking-tight">
                                {p.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {spec && (
                                  <span className="text-[10px] text-white uppercase font-black">
                                    {spec}
                                  </span>
                                )}
                                {spec && (
                                  <span className="w-1 h-1 rounded-full bg-white/50" />
                                )}
                                <span className="text-[10px] text-white/50 font-mono-tactical tracking-tighter">
                                  LOTE: {p.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black font-mono-tactical tracking-tighter text-white">
                              R$ {p.sale.toLocaleString("pt-BR")}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <div className="text-[9px] font-black uppercase tracking-widest text-primary">
                                {age} Dias
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Actions */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 p-6 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <button
                      onClick={handleWhatsAppShare}
                      className="w-full flex h-14 items-center justify-center rounded-2xl bg-green-600 text-white font-black text-xs gap-3 hover:bg-green-500 transition-all uppercase tracking-widest shadow-glow-green/20"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Disparar Promoção (WhatsApp)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-success/20 animate-ping opacity-20" />
                    <Boxes className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">
                    Estoque 100% Aquecido
                  </h3>
                  <p className="text-white text-sm max-w-xs mx-auto mb-8 font-bold">
                    Seu inventário está com excelente giro! Nenhum item parado no momento.
                  </p>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-white/10 text-white rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white"
                  >
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
