import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Zap, 
  Brain, 
  ShieldCheck, 
  Smartphone,
  Star,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";

interface ManualModalProps {
  open: boolean;
  onClose: () => void;
}

const slides = [
  {
    id: 1,
    title: "PROTOCOLO DE INICIALIZAÇÃO",
    subtitle: "Boas-vindas ao Victor's Smart Estoque v2.0",
    description: "Você acaba de assumir o comando da ferramenta de gestão mais avançada do mercado. Nossa interface foi desenhada para oferecer precisão milimétrica em cada movimentação de estoque.",
    image: "/assets/manual/security.png",
    accent: "cyan",
    icon: Zap,
    features: ["Acesso Biométrico/PIN", "Criptografia de Dados", "Sincronização em Tempo Real"]
  },
  {
    id: 2,
    title: "RADAR DE MOVIMENTAÇÃO",
    subtitle: "Scanner Tático HUD",
    description: "Utilize a câmera do seu smartphone como um radar de alta precisão. O scanner tático identifica produtos instantaneamente, permitindo entradas e saídas sem a necessidade de digitação manual.",
    image: "/assets/manual/scanner.png",
    accent: "emerald",
    icon: Smartphone,
    features: ["Leitura de QR/Barcode", "Auto-foco em Baixa Luz", "Feedback Vibratório"]
  },
  {
    id: 3,
    title: "AUDITORIA GEMMA-X",
    subtitle: "Inteligência Artificial de Elite",
    description: "O cérebro do sistema. Nossa IA audita tabelas de preços complexas, identifica divergências e sugere as melhores janelas de compra, transformando dados brutos em lucro real.",
    image: "/assets/manual/ai.png",
    accent: "amethyst",
    icon: Brain,
    features: ["Análise de Preços", "Previsão de Demanda", "Relatórios via Chat"]
  },
  {
    id: 4,
    title: "PROTOCOLO LINHA VERMELHA",
    subtitle: "Segurança e Suporte Inabaláveis",
    description: "Em situações críticas, a Linha Vermelha conecta você instantaneamente ao comando central via WhatsApp. Segurança total para que você nunca opere sozinho.",
    image: "/assets/manual/support.png",
    accent: "ruby",
    icon: ShieldCheck,
    features: ["Conexão Direta WhatsApp", "Tickets de Alta Prioridade", "Monitoramento Live"]
  }
];

export const ManualModal = ({ open, onClose }: ManualModalProps) => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % slides.length);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  const slide = slides[current];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-black-piano neon-blue-border relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-glow-cyan">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Manual Operacional</h2>
                  <p className="text-sm font-black text-white tracking-tighter uppercase">Guia de Elite — v2.0</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
              {/* Image Side */}
              <div className="relative h-64 w-full md:h-auto md:w-1/2 overflow-hidden bg-black/40">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={slide.image}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    src={slide.image}
                    alt={slide.title}
                    className="h-full w-full object-cover opacity-60"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r" />
                
                {/* Tactical Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-glow-cyan" />
                      <span className="font-mono-tactical text-[8px] uppercase tracking-widest text-primary/60">Sincronização Ativa</span>
                   </div>
                   <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i === current ? "bg-primary shadow-glow-cyan" : "bg-white/10"}`} />
                      ))}
                   </div>
                </div>
              </div>

              {/* Text Side */}
              <div className="flex flex-1 flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <slide.icon className={`h-6 w-6 text-primary`} />
                      <span className="font-mono-tactical text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                        PROTOCOLO 0{slide.id}
                      </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 uppercase leading-none">
                      {slide.title}
                    </h3>
                    <p className="text-lg font-bold text-white/60 mb-6 uppercase tracking-tight">
                      {slide.subtitle}
                    </p>

                    <p className="text-base text-white/40 leading-relaxed mb-8 font-medium">
                      {slide.description}
                    </p>

                    <div className="mt-auto space-y-4">
                       <h4 className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/20">Recursos de Elite:</h4>
                       <div className="grid grid-cols-1 gap-3">
                          {slide.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
                               <CheckCircle2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                               <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{feature}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between border-t border-white/10 px-8 py-6 bg-white/[0.02]">
              <button
                onClick={prev}
                className="flex items-center gap-2 font-mono-tactical text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              
              <div className="hidden md:flex items-center gap-4">
                 <div className="font-mono-tactical text-[9px] uppercase tracking-[0.3em] text-white/20">
                    SISTEMA INTELIGENTE DE ESTOQUE V2.0
                 </div>
              </div>

              <button
                onClick={next}
                className="bg-primary text-black flex items-center gap-2 px-8 py-3 rounded-2xl font-mono-tactical text-[10px] font-black uppercase tracking-widest hover:shadow-glow-cyan transition-all"
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
