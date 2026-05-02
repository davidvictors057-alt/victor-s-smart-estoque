import { useState, useRef, useEffect, useMemo } from "react";
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
  Cpu,
  X,
  RefreshCw
} from "lucide-react";
import { useStore } from "@/store/useStore";

// Custom components for Markdown to handle semantic colors
const MarkdownComponents = {
  h1: ({ children }: any) => <h1 className="text-xl font-black text-white mt-6 mb-3 border-b border-ai/30 pb-2 uppercase tracking-tighter text-glow-ai">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-black text-white mt-5 mb-2 uppercase tracking-tighter text-glow-ai">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-md font-black text-ai mt-4 mb-1 uppercase tracking-tighter">{children}</h3>,
  p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-justify">{children}</p>,
  ul: ({ children }: any) => <ul className="list-none space-y-2 mb-4">{children}</ul>,
  li: ({ children }: any) => (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ai shrink-0 shadow-[0_0_5px_rgba(0,163,255,0.8)]" />
      <span>{children}</span>
    </li>
  ),
  table: ({ children }: any) => (
    <div className="my-6 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-white/10 text-[10px] font-black uppercase tracking-widest text-ai">{children}</thead>,
  th: ({ children }: any) => <th className="px-4 py-3 font-black">{children}</th>,
  td: ({ children }: any) => <td className="border-t border-white/5 px-4 py-3 text-white/80 font-medium">{children}</td>,
  strong: ({ children }: any) => <strong className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{children}</strong>,
  desc: ({ children }: any) => <span className="text-[10px] font-bold text-ai/80 bg-ai/5 px-1.5 py-0.5 rounded border border-ai/20 mx-1 uppercase tracking-tighter">{children}</span>,
  price: ({ children }: any) => <span className="font-mono-tactical font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{children}</span>,
  warn: ({ children }: any) => <span className="font-black text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">{children}</span>,
  name: ({ children }: any) => <span className="font-black text-white border-b border-white/30 pb-0.5">{children}</span>,
  hr: () => <hr className="my-4 border-white/10" />,
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
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Fragment Analysis helper - Memoized to prevent re-parsing on every re-render
  const fragmentedInsights = useMemo(() => {
    if (!lastAiAnalysis) return [];
    return String(lastAiAnalysis).split(/(?=### )/g).filter(s => s.trim().length > 0);
  }, [lastAiAnalysis]);

  // Auto-scroll parent when view opens
  useEffect(() => {
    const mainScroll = document.querySelector('.custom-scrollbar');
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Erro ao iniciar reconhecimento:", err);
      }
    }
  };

  useEffect(() => {
    if (showChatModal && chatHistory.length > 0) {
      const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatHistory.length, showChatModal]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = typeof textOverride === 'string' ? textOverride : inputText;
    if (!text.trim() || isAiLoading) return;
    setInputText("");
    await sendChatMessage(text);
  };

  const handleDebate = (insight: string) => {
    // Extrai apenas a primeira linha (título) para o prompt inicial ser mais limpo
    const topic = String(insight).split('\n')[0].replace(/#+/g, '').replace(/[\*\_]+/g, '').trim();
    const text = `Vamos debater o tópico "${topic}". Quais as implicações logísticas e os próximos passos táticos?`;
    setShowChatModal(true);
    setTimeout(() => handleSendMessage(text), 100);
  };

  return (
    <div className="flex flex-col px-2 overflow-hidden h-[calc(100dvh-240px)]">
      {/* Tab Switcher - Segmented Control */}
      <div className="bg-black-piano neon-blue-border-thin mb-4 flex rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => setShowChatModal(true)}
          className="relative flex-1 rounded-xl py-2.5 font-mono-tactical text-[11px] font-black uppercase tracking-widest transition-all text-white hover:text-white"
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat Estratégico
          </div>
        </button>
        <button
          className="relative flex-1 rounded-xl py-2.5 font-mono-tactical text-[11px] font-black uppercase tracking-widest transition-all bg-ai text-ai-foreground shadow-glow-ai"
        >
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            Núcleo Cognitivo
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
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

            {lastAiAnalysis && (
              <div className="space-y-6">
                {fragmentedInsights.map((content, idx) => {
                  // Extract title and body
                  const lines = content.trim().split('\n');
                  const rawTitle = lines[0] || '';
                  // Limpeza profunda do título (remove #, *, _, ", etc)
                  const title = rawTitle.replace(/^#+\s*/, '').replace(/[\*\_\"\'\`]+/g, '').trim();
                  const body = lines.slice(1).join('\n').trim() || content.trim();
                  const finalBody = body.startsWith('###') ? body.replace(/^###\s+.*?\n/, '') : body;

                  return (
                    <motion.article
                      key={idx}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: idx * 0.05 
                      }}
                      className="bg-black-piano neon-blue-border-thin group relative overflow-hidden rounded-3xl p-8 shadow-2xl"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                        <div className="font-mono-tactical text-[8px] font-black text-ai uppercase tracking-widest">SEC {idx + 1}</div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ai/10 text-ai ring-1 ring-ai/30 shadow-glow-ai">
                              <Zap className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter text-glow-ai">{title || "Insight Tático"}</h3>
                          </div>
                          <div className="font-mono-tactical flex items-center gap-1.5 rounded-full bg-ai/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-ai ring-1 ring-ai/50">
                            TOPIC {idx + 1}
                          </div>
                        </div>

                        <div className="text-sm font-medium leading-relaxed text-white/90 prose-ai-insight">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                            components={MarkdownComponents as any}
                          >
                            {finalBody}
                          </ReactMarkdown>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                          <button 
                            onClick={() => handleDebate(content)}
                            className="flex-1 rounded-xl bg-ai py-3 text-[11px] font-black uppercase tracking-widest text-ai-foreground shadow-glow-ai transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                          >
                            DEBATER ESTE TÓPICO
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showChatModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black-piano p-4 md:p-8"
          >
            <div className="flex h-full flex-col overflow-hidden bg-black-piano neon-blue-border rounded-[2rem] shadow-2xl relative border-ai/30">
              {/* Chat Header - Fullscreen Version */}
              <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-ai/20 via-white/[0.02] to-transparent backdrop-blur-3xl px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/20 text-ai ring-1 ring-ai/40 shadow-[0_0_20px_rgba(0,163,255,0.4)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-black" />
                  </div>
                  <div>
                     <div className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-1">Debate Estratégico</div>
                     <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] text-ai/80">Sincronia Neural 3.1</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 py-1">
                   <button 
                     onClick={() => setShowChatModal(false)} 
                     className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500 text-white shadow-glow-rose transition-all border border-rose-400/30 active:scale-90"
                     title="Fechar Debate"
                   >
                      <X className="h-6 w-6" />
                   </button>
                   <button 
                     onClick={clearChat} 
                     className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 hover:text-white transition-all border border-white/10 active:scale-90"
                     title="Limpar Histórico"
                   >
                     <RefreshCw className="h-4 w-4" />
                   </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
                {(!chatHistory || chatHistory.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
                     <Brain className="h-16 w-16 text-ai animate-pulse" />
                     <p className="text-xs text-white font-black uppercase tracking-[0.5em]">Aguardando Fluxo de Dados...</p>
                  </div>
                )}
                {(chatHistory || []).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[70%] rounded-[2.5rem] px-8 py-6 shadow-2xl ${
                      m.role === "user" 
                        ? "bg-primary text-black font-black rounded-tr-none shadow-glow-cyan" 
                        : "bg-white/5 text-white border border-white/10 rounded-tl-none backdrop-blur-xl"
                    }`}>
                      <div className="text-base leading-relaxed">
                        {m.role === 'model' ? (
                          <div className="prose-ai-insight">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={MarkdownComponents as any}
                            >
                              {String(m.content || m.text || "")}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap font-bold">{String(m.content || m.text || "")}</p>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-end justify-between border-t border-black/5 md:border-white/10 pt-4">
                         <div className="flex flex-col items-start gap-1">
                          <div className={`font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] ${
                            m.role === "user" ? "text-black/60" : "text-white/40"
                          }`}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        
                        {m.role === 'model' && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-ai/10 border border-ai/20">
                             <Cpu className="h-3 w-3 text-ai" />
                             <span className="text-[9px] font-black text-ai uppercase tracking-widest">Verified Insight</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="flex justify-start"
                   >
                      <div className="bg-ai/10 text-ai border border-ai/20 rounded-2xl rounded-tl-none px-8 py-5 backdrop-blur-md flex items-center gap-4 shadow-glow-ai">
                         <div className="h-2 w-2 rounded-full bg-ai animate-ping" />
                         <span className="text-[11px] font-black uppercase tracking-widest italic">Processando Inteligência...</span>
                      </div>
                   </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-10 bg-gradient-to-t from-black to-transparent">
                <div className="bg-white/5 neon-blue-border-thin flex items-center gap-2 rounded-3xl px-4 py-2 transition-all focus-within:neon-blue-border focus-within:bg-white/10 backdrop-blur-md">
                  <button 
                    onClick={toggleListening}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                      isListening 
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]' 
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
                    placeholder="Diretriz estratégica..."
                    rows={1}
                    className="flex-1 bg-transparent font-bold text-base text-white outline-none placeholder:text-white/30 resize-none py-2 min-h-[44px] max-h-32 no-scrollbar"
                  />
                  <button 
                    onClick={() => handleSendMessage()}
                    disabled={isAiLoading}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-black shadow-glow-cyan transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    {isAiLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
