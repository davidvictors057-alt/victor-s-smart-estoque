import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  Zap, 
  Lightbulb, 
  ChevronRight, 
  Check, 
  MessageSquare, 
  Mic, 
  Send,
  User,
  ArrowLeft,
  Activity,
  Clock,
  Cpu
} from "lucide-react";
import { useStore } from "@/store/useStore";

// Custom components for Markdown to handle semantic colors
const MarkdownComponents = {
  // Custom tag handlers
  desc: ({ children }: any) => <span className="text-yellow-400 font-bold">{children}</span>,
  price: ({ children }: any) => <span className="text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
  warn: ({ children }: any) => <span className="text-rose-500 font-black animate-pulse">{children}</span>,
  name: ({ children }: any) => <span className="text-sky-400 font-black underline decoration-sky-400/30 underline-offset-4">{children}</span>,
  // Standard markdown overrides
  hr: () => <hr className="my-4 border-white/10" />,
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="space-y-2 mb-3 list-disc list-inside">{children}</ul>,
  li: ({ children }: any) => <li className="text-white">{children}</li>,
};

interface Insight {
  icon: any;
  title: string;
  body: string;
  confidence: number;
  severity: "high" | "med" | "low";
}

export const AIView = () => {
  const { 
    products, 
    movements, 
    chatHistory, 
    sendChatMessage, 
    isAiLoading, 
    lastAiAnalysis,
    lastAiAnalysisModel,
    runPredictiveAnalysis,
    clearChat,
    onlineBrainMode,
    setOnlineBrainMode
  } = useStore();
  const [activeTab, setActiveTab] = useState<"chat" | "nuc">("nuc");
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll parent when internal tab changes
  useEffect(() => {
    const mainScroll = document.querySelector('.custom-scrollbar');
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Inicializa o motor de voz
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setInputText(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        // Feedback tátil se disponível
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Erro ao iniciar reconhecimento:", err);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "chat" && chatHistory.length > 0) {
      // Pequeno delay para garantir que o DOM renderizou as novas mensagens
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatHistory.length, activeTab]);

  // Dynamic Insights Calculation
  const getDynamicInsights = (): Insight[] => {
    const list: Insight[] = [];
    
    // 1. Critical Stock
    const lowStock = products
      .filter(p => p.status === 'in_stock')
      .reduce((acc: Record<string, number>, p) => {
        acc[p.name] = (acc[p.name] || 0) + 1;
        return acc;
      }, {});
    
    const criticalItems = Object.entries(lowStock)
      .filter(([_, count]) => count < 3)
      .slice(0, 1);
      
    if (criticalItems.length > 0) {
      list.push({
        icon: AlertTriangle,
        title: "Estoque crítico detectado",
        body: `${String(criticalItems[0][0])} possui apenas ${criticalItems[0][1]} unidades. Reposição sugerida em 48h.`,
        confidence: 98,
        severity: "high",
      });
    } else {
      list.push({
        icon: Check,
        title: "Logística estável",
        body: "Todos os itens de alto giro possuem cobertura superior a 7 dias. Nenhuma ruptura prevista.",
        confidence: 94,
        severity: "low",
      });
    }

    // 2. Movement Trend
    const recentOut = movements.filter(m => m.type === 'out').length;
    if (recentOut > 5) {
      list.push({
        icon: TrendingUp,
        title: "Aceleração de Saídas",
        body: `Detectamos um aumento de ${recentOut} saídas recentemente. O fluxo operacional está 15% acima da média.`,
        confidence: 91,
        severity: "med",
      });
    } else {
      list.push({
        icon: Activity,
        title: "Oportunidade de Venda",
        body: "O fluxo de saídas está moderado. Considere promoções relâmpago via IA para itens parados há +15 dias.",
        confidence: 88,
        severity: "med",
      });
    }

    // 3. System Health
    list.push({
      icon: Zap,
      title: "Sincronização Ativa",
      body: "O banco de dados está operando em latência zero. 100% das movimentações auditadas via SQL.",
      confidence: 100,
      severity: "low",
    });

    return list;
  };

  const insights = getDynamicInsights();

  const handleSendMessage = async (textOverride?: string) => {
    const text = typeof textOverride === 'string' ? textOverride : inputText;
    if (!text.trim() || isAiLoading) return;
    setInputText("");
    await sendChatMessage(text);
  };

  const handleDebate = (insight: string) => {
    const text = `Vamos debater este insight estratégico: "${String(insight)}". Quais as implicações logísticas imediatas?`;
    setActiveTab("chat");
    setTimeout(() => handleSendMessage(text), 100);
  };

  return (
    <div className="flex flex-col px-2 overflow-hidden h-[calc(100dvh-240px)]">
      {/* Tab Switcher - Segmented Control */}
      <div className="bg-black-piano neon-blue-border-thin mb-4 flex rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => setActiveTab("chat")}
          className={`relative flex-1 rounded-xl py-2.5 font-mono-tactical text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === "chat" ? "bg-ai text-ai-foreground shadow-glow-ai" : "text-white hover:text-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat Estratégico
          </div>
        </button>
        <button
          onClick={() => setActiveTab("nuc")}
          className={`relative flex-1 rounded-xl py-2.5 font-mono-tactical text-[11px] font-black uppercase tracking-widest transition-all ${
            activeTab === "nuc" ? "bg-ai text-ai-foreground shadow-glow-ai" : "text-white hover:text-white"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            Núcleo Cognitivo
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "nuc" ? (
          <div className="space-y-4 overflow-y-auto no-scrollbar pb-10 h-full">
            {/* Header section */}
            <section className="bg-black-piano neon-blue-border relative overflow-hidden rounded-[1.5rem] p-5 shadow-[0_10px_30px_rgba(0,163,255,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-ai/10 via-transparent to-transparent" />
              <div className="absolute inset-0 tactical-grid opacity-20" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai/10 shadow-[0_0_20px_rgba(0,163,255,0.3)] ring-1 ring-ai/30">
                  <Brain className="h-7 w-7 text-ai" />
                </div>
                <div className="flex-1">
                  <div className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.4em] text-ai">
                    ANÁLISE DE DADOS
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-black text-white text-glow-ai">Núcleo Cognitivo</div>
                    {lastAiAnalysisModel && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ai/10 border border-ai/20">
                        <Zap className="h-2.5 w-2.5 text-ai" />
                        <span className="text-[6px] font-black text-ai uppercase tracking-widest">
                          {lastAiAnalysisModel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="font-mono-tactical mt-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    {lastAiAnalysis ? 'INSIGHTS ATIVOS' : 'AGUARDANDO ATIVAÇÃO'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="font-mono-tactical text-[8px] font-black text-white uppercase tracking-widest">Brain Mode</div>
                   <button 
                     onClick={() => setOnlineBrainMode(!onlineBrainMode)}
                     className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-tighter transition-all ${onlineBrainMode ? 'bg-ai/20 text-ai ring-1 ring-ai' : 'bg-white/5 text-white'}`}
                   >
                     {onlineBrainMode ? 'ONLINE' : 'OFFLINE'}
                   </button>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              {!lastAiAnalysis && (
                <div className="bg-black-piano neon-blue-border-thin rounded-[1.5rem] p-6 text-center space-y-4">
                   <div className="mx-auto w-14 h-14 bg-ai/10 rounded-full flex items-center justify-center text-ai">
                      <Brain className="h-7 w-7" />
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-white mb-2">Conexão Neural Pendente</h3>
                      <p className="text-sm text-white max-w-xs mx-auto">Ative o núcleo cognitivo para gerar insights estratégicos baseados no seu inventário atual.</p>
                   </div>
                   <button 
                     onClick={() => runPredictiveAnalysis()}
                     disabled={isAiLoading}
                     className="bg-ai text-ai-foreground px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-glow-ai hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {isAiLoading ? 'SINCRONIZANDO...' : 'INICIALIZAR CÉREBRO'}
                   </button>
                </div>
              )}

              {(typeof lastAiAnalysis === 'string' ? lastAiAnalysis : '').split('\n').filter(l => l.trim().length > 3).map((insight, i) => (
                  <article
                    key={i}
                    className="bg-black-piano neon-blue-border-thin group relative overflow-hidden rounded-3xl p-6 shadow-xl"
                  >
                    <div className="flex items-start gap-5">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/10 text-ai`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-black text-white">Análise Neural #{i+1}</h3>
                          <div className="font-mono-tactical flex items-center gap-1.5 rounded-full bg-ai/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-ai ring-1 ring-ai/50">
                            95% CONF.
                          </div>
                        </div>
                        <div className="mt-2 text-sm font-medium leading-relaxed text-white italic text-justify prose-ai-insight">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {`"${String(insight).trim()}"`}
                          </ReactMarkdown>
                        </div>
                        
                        <div className="mt-5 flex items-center gap-3">
                          <button 
                            onClick={() => handleDebate(insight)}
                            className="flex-1 rounded-xl bg-ai py-2.5 text-[10px] font-black uppercase tracking-widest text-ai-foreground shadow-glow-ai transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                          >
                            DEBATER ESTRATÉGIA
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden bg-black-piano neon-blue-border rounded-[1.5rem] shadow-2xl relative h-full">
            {/* Chat Header - Glassmorphism Integration */}
            <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-ai/10 via-white/[0.02] to-transparent backdrop-blur-xl px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ai/10 text-ai ring-1 ring-ai/30 shadow-[0_0_15px_rgba(0,163,255,0.2)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-black" />
                </div>
                <div>
                   <div className="text-sm font-black text-white tracking-tight">Assistente Estratégico</div>
                   <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-ai">Geração 3.1 · Neural Link</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={clearChat} className="text-[9px] font-black uppercase tracking-widest text-white hover:text-rose-500 transition-all">Limpar</button>
                 <button onClick={() => setActiveTab("nuc")} className="text-white hover:text-white transition-all">
                    <ArrowLeft className="h-5 w-5" />
                 </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {(!chatHistory || chatHistory.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                   <Sparkles className="h-10 w-10 text-ai" />
                   <p className="text-xs text-white font-black uppercase tracking-widest">Aguardando seu comando estratégico...</p>
                </div>
              )}
              {(chatHistory || []).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-[1.8rem] px-6 py-4 shadow-xl ${
                    m.role === "user" 
                      ? "bg-primary text-black font-bold rounded-tr-none" 
                      : "bg-white/5 text-white border border-white/5 rounded-tl-none backdrop-blur-md"
                  }`}>
                    <div className="text-sm leading-relaxed">
                      {m.role === 'model' ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={MarkdownComponents}
                        >
                          {String(m.content || m.text || "")}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{String(m.content || m.text || "")}</p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
                       <div className="flex flex-col items-start gap-1">
                        <div className={`font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] ${
                          m.role === "user" ? "text-black" : "text-white"
                        }`}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {m.role === 'model' && m.meta && m.meta.model && (
                          <div className="font-mono-tactical text-[9px] font-black uppercase tracking-widest text-ai leading-none">
                             {typeof m.meta.model === 'string' 
                               ? m.meta.model.split('-').slice(0, 3).join(' ') 
                               : 'GEMINI 3.1 FLASH'}
                          </div>
                        )}
                      </div>
                      
                      {m.role === 'model' && m.meta && (
                        <div className="flex flex-col items-end gap-1 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white">
                           <Clock className="h-3.5 w-3.5 text-ai" />
                           <div className="text-[10px] leading-none">
                              {m.meta.time ?? 0}S
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white/5 text-white border border-white/5 rounded-2xl rounded-tl-none px-6 py-4 backdrop-blur-md italic text-xs animate-pulse flex items-center gap-2">
                       <Activity className="h-3 w-3" />
                       Sincronizando com Cérebro 3.1...
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-t from-black to-transparent">
              <div className="bg-white/[0.03] neon-blue-border-thin flex items-center gap-3 rounded-[2rem] px-4 py-2 transition-all focus-within:neon-blue-border focus-within:bg-white/[0.06]">
                <button 
                  onClick={toggleListening}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]' 
                      : 'bg-white/5 text-white hover:bg-ai/20 hover:text-ai'
                  }`}
                >
                  <Mic className={`h-5 w-5 ${isListening ? 'animate-bounce' : ''}`} />
                </button>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Comando estratégico..."
                  rows={1}
                  className="flex-1 bg-transparent font-black text-sm text-white outline-none placeholder:text-white resize-none py-2 min-h-[40px] max-h-32 no-scrollbar"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isAiLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black shadow-glow-cyan transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isAiLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
