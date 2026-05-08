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
  CheckCircle2,
  Cpu,
  Globe,
  Activity,
  Layers,
  ArrowRight,
  Mic,
  FileText,
  Users,
  Lock,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";

interface ManualModalProps {
  open: boolean;
  onClose: () => void;
}

const slides = [
  {
    id: 1,
    title: "VICTOR'S SMART ESTOQUE",
    subtitle: "DNA de Inovação v2.0",
    description: "Boas-vindas ao ecossistema de gestão mais avançado do mercado. Uma ferramenta tática desenhada para precisão absoluta e lucro escalável.",
    image: "/assets/manual/protocol_01.png?v=2",
    accent: "cyan",
    icon: Star,
    stats: { label: "Versão", value: "2.0 PRO" },
    features: ["Interface Tática", "Motor Neural Ativo", "Latência Zero"]
  },
  {
    id: 2,
    title: "DASHBOARD DE COMANDO",
    subtitle: "Monitoramento em Tempo Real",
    description: "Visualize todo o seu império em um cockpit tático. Métricas live, fluxo de caixa e alertas de estoque crítico em uma única tela.",
    image: "/assets/manual/protocol_02.png?v=2",
    accent: "emerald",
    icon: Activity,
    stats: { label: "Status Rede", value: "ONLINE" },
    features: ["Visão Global", "Métricas em Tempo Real", "Alertas Inteligentes"]
  },
  {
    id: 3,
    title: "RADAR DE INVENTÁRIO",
    subtitle: "Busca e Organização Instantânea",
    description: "Encontre qualquer produto em milissegundos. Nosso radar tático organiza marcas, modelos e categorias com filtros de alta performance.",
    image: "/assets/manual/protocol_03.png?v=2",
    accent: "amethyst",
    icon: Layers,
    stats: { label: "Velocidade", value: "0.01ms" },
    features: ["Filtros Avançados", "Categorização Automática", "Busca Semântica"]
  },
  {
    id: 4,
    title: "CADASTRO TÁTICO",
    subtitle: "Registro com Biometria Visual",
    description: "Adicione produtos com foto e detalhes técnicos em segundos. Interface otimizada para reduzir o tempo de entrada em 80%.",
    image: "/assets/manual/protocol_04.png?v=2",
    accent: "cyan",
    icon: Zap,
    stats: { label: "Agilidade", value: "+85%" },
    features: ["Foto do Produto", "Preenchimento Inteligente", "Interface Ergonômica"]
  },
  {
    id: 5,
    title: "SCANNER DE IMEI / SKU",
    subtitle: "Precisão de Laser Digital",
    description: "Elimine erros humanos. Utilize a câmera para bipar IMEIs e SKUs diretamente da caixa com foco ultra-rápido.",
    image: "/assets/manual/protocol_05.png?v=2",
    accent: "emerald",
    icon: Smartphone,
    stats: { label: "Erro Humano", value: "0%" },
    features: ["Leitura Dupla de IMEI", "Identificação de SKU", "Bipe Tátil"]
  },
  {
    id: 6,
    title: "CÉREBRO NEURAL (IA)",
    subtitle: "Assistente Estratégico Gemini 3.1",
    description: "Consulte o cérebro do sistema via chat. Pergunte sobre estoque, preços e tendências como se estivesse falando com um consultor.",
    image: "/assets/manual/protocol_06.png?v=2",
    accent: "amethyst",
    icon: Brain,
    stats: { label: "Inteligência", value: "GEMINI 3.1" },
    features: ["Análise de Dados", "Sugestões de Compra", "Relatórios via Chat"]
  },
  {
    id: 7,
    title: "COMANDOS DE VOZ",
    subtitle: "Operação Hands-Free",
    description: "Gerencie seu estoque sem tocar na tela. Utilize comandos de voz de alta fidelidade para pesquisar e registrar ações.",
    image: "/assets/manual/protocol_07.png?v=2",
    accent: "ruby",
    icon: Mic,
    stats: { label: "Fidelidade", value: "HD VOICE" },
    features: ["Reconhecimento Nativo", "Feedback de Voz", "Agilidade Total"]
  },
  {
    id: 8,
    title: "AUDITORIA DE NOTAS",
    subtitle: "Leitura Automática de Documentos",
    description: "Suba PDFs de notas e tabelas e deixe que a IA extraia os dados, identifique divergências e atualize seu estoque automaticamente.",
    image: "/assets/manual/protocol_08.png?v=2",
    accent: "cyan",
    icon: FileText,
    stats: { label: "Extração", value: "OCR-PRO" },
    features: ["Leitura de PDF/Tabelas", "Comparativo de Preços", "Update em Massa"]
  },
  {
    id: 9,
    title: "GESTÃO DE EQUIPE",
    subtitle: "Controle de Acessos de Elite",
    description: "Gerencie permissões de usuários. Saiba exatamente quem fez cada movimentação com logs de auditoria detalhados.",
    image: "/assets/manual/protocol_09.png?v=2",
    accent: "emerald",
    icon: Users,
    stats: { label: "Segurança", value: "MULTI-USER" },
    features: ["Níveis de Acesso", "Logs de Atividade", "Gestão de PINs"]
  },
  {
    id: 10,
    title: "SEGURANÇA MÁXIMA",
    subtitle: "Dados Blindados em Nuvem",
    description: "Criptografia de ponta a ponta e backups automáticos. Seu estoque está protegido contra perdas e acessos não autorizados.",
    image: "/assets/manual/protocol_10.png?v=2",
    accent: "amethyst",
    icon: Lock,
    stats: { label: "Backup", value: "CLOUD-SYNC" },
    features: ["Criptografia AES", "Backup Diário", "Proteção de Dados"]
  },
  {
    id: 11,
    title: "ECOSSISTEMA PWA",
    subtitle: "Instalação Nativa no Celular",
    description: "Leve o Victor's Smart Estoque para qualquer lugar. Instale como app no Android ou iOS e receba notificações push críticas.",
    image: "/assets/manual/protocol_11.png?v=2",
    accent: "ruby",
    icon: Globe,
    stats: { label: "Uptime", value: "99.99%" },
    features: ["App Android/iOS", "Funcionamento Offline", "Push Notifications"]
  },
  {
    id: 12,
    title: "LINHA VERMELHA",
    subtitle: "Suporte de Elite 24/7",
    description: "Conexão direta via WhatsApp com o Comando Central. Nunca opere sozinho, suporte tático sempre que precisar.",
    image: "/assets/manual/protocol_12.png?v=2",
    accent: "emerald",
    icon: MessageSquare,
    stats: { label: "Suporte", value: "VIP 24/7" },
    features: ["Direct WhatsApp", "Suporte Especializado", "Comunidade Victor's"]
  }
];

export const ManualModal = ({ open, onClose }: ManualModalProps) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  // Reset to first slide every time it opens
  useEffect(() => {
    if (open) {
      setCurrent(0);
      setDirection(1);
    }
  }, [open]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrent((c) => (c + newDirection + slides.length) % slides.length);
  };

  const slide = slides[current];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/98 backdrop-blur-3xl"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-black-piano neon-blue-border relative flex h-full w-full flex-col overflow-hidden shadow-[0_0_100px_rgba(0,163,255,0.2)] md:h-[90vh] md:max-w-6xl md:rounded-[3rem]"
          >
            {/* Header - Optimized for Mobile */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-8 md:py-8 pointer-events-none">
              <div className="flex items-center gap-3 pointer-events-auto">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-md ring-1 ring-white/10 shadow-glow-cyan">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
                </div>
                <div className="hidden sm:block">
                   <h2 className="font-mono-tactical text-[8px] font-black uppercase tracking-[0.4em] text-white">Manual Operacional</h2>
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white tracking-tighter uppercase">Showcase Premium</span>
                   </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="pointer-events-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-md text-white hover:bg-rose-500 hover:text-white transition-all ring-1 ring-white/10"
              >
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden pt-16 md:pt-0">
              
              {/* Left Side: Visuals */}
              <div className="relative h-[25vh] shrink-0 overflow-hidden md:h-auto md:w-3/5">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={slide.id}
                    custom={direction}
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ duration: 0.6 }}
                    className="h-full w-full"
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black-piano via-black-piano/40 to-transparent md:bg-gradient-to-r" />
                  </motion.div>
                </AnimatePresence>
                
                {/* Mobile Stats Badge */}
                <div className="absolute bottom-4 left-6 md:bottom-10 md:left-10">
                   <div className="bg-primary/20 backdrop-blur-xl border border-primary/30 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3">
                      <Activity className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-mono-tactical text-[7px] text-white uppercase tracking-widest">{slide.stats.label}</div>
                        <div className="font-mono-tactical text-[10px] md:text-xs text-white font-black uppercase tracking-widest">{slide.stats.value}</div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="flex flex-1 flex-col bg-black-piano px-6 py-6 md:px-16 md:py-16 justify-start md:justify-center overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-md"
                  >
                    <div className="flex items-center gap-3 mb-3 md:mb-6">
                       <div className="font-mono-tactical text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-primary">
                         PROTOCOL 0{slide.id} / 12
                       </div>
                    </div>

                    <h3 className="text-2xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-4 uppercase leading-none">
                      {slide.title}
                    </h3>
                    <p className="text-lg md:text-xl font-bold text-primary mb-4 md:mb-8 uppercase tracking-tight">
                      {slide.subtitle}
                    </p>

                    <p className="text-sm md:text-lg text-white leading-relaxed mb-6 md:mb-10 font-medium">
                      {slide.description}
                    </p>

                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {slide.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] md:text-sm font-black text-white group-hover:text-white transition-colors uppercase tracking-tight">{feature}</span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Controls - Optimized for Mobile */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black-piano md:px-12 md:py-8 md:bg-transparent">
              <button
                onClick={() => paginate(-1)}
                className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-md text-white ring-1 ring-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div className="hidden sm:flex gap-1.5">
                 {slides.map((_, i) => (
                   <div
                     key={i}
                     className={`h-1 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-1.5 bg-white/10"}`}
                   />
                 ))}
              </div>
              
              <div className="sm:hidden font-mono-tactical text-[10px] font-black text-white">
                {current + 1} / 12
              </div>

              <button
                onClick={() => paginate(1)}
                className="bg-primary px-5 py-2.5 md:px-8 md:py-4 rounded-xl font-black text-[10px] md:text-[12px] text-black shadow-glow-cyan uppercase tracking-widest flex items-center gap-2"
              >
                {current === slides.length - 1 ? "REINICIAR" : "PRÓXIMO"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
