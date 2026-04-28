import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Cpu, 
  Database, 
  Sigma, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  Code2, 
  Brain, 
  Calculator, 
  Zap, 
  Cable, 
  Component,
  Award,
  Globe,
  Rocket
} from 'lucide-react';

interface ConhecendoDesenvolvedorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConhecendoDesenvolvedor({ isOpen, onClose }: ConhecendoDesenvolvedorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black flex flex-col overflow-y-auto no-scrollbar"
        >
          {/* Blue Neon Border Frame */}
          <div className="fixed inset-0 pointer-events-none border-[3px] border-primary/30 shadow-[inset_0_0_50px_rgba(0,163,255,0.2)] z-[1000]" />
          
          <button 
            onClick={onClose}
            className="fixed top-8 right-8 z-[1010] p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 transition-all hover:scale-110 active:scale-95 group"
          >
            <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="relative min-h-screen flex flex-col items-center py-20 px-6 lg:px-12 max-w-6xl mx-auto w-full">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-8 mb-16 text-center"
            >
              <div className="relative group">
                <div className="absolute -inset-6 bg-primary blur-[60px] opacity-20 animate-pulse" />
                <div className="relative w-28 h-28 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Cpu className="w-14 h-14 text-primary drop-shadow-[0_0_15px_rgba(0,163,255,0.8)] animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase mb-2">
                  David Caetano Ferreira
                </h1>
                <p className="text-primary font-bold text-xs lg:text-xl uppercase tracking-[0.3em] lg:tracking-[0.5em]">
                  Físico & Engenheiro de Sistemas | Especialista em Inteligência de Dados
                </p>
              </div>
            </motion.div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-16" />

            {/* Specializations Grid */}
            <div className="w-full mb-20">
              <div className="flex items-center gap-3 mb-10">
                <Award className="text-primary" size={28} />
                <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-widest italic">FORMAÇÃO & ESPECIALIZAÇÕES</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {[
                  {
                    icon: <Database size={28} />,
                    tag: "Pós-Graduação",
                    title: "Ciência de Dados e IA Aplicada",
                    desc: "Foco: Engenharia de dados preditivos para projeção de faturamento e inteligência de mercado."
                  },
                  {
                    icon: <Cpu size={28} />,
                    tag: "Pós-Graduação",
                    title: "Indústria 4.0: Engenharia e Automação",
                    desc: "Foco: Arquitetura de sistemas integrados, automação de processos administrativos e fluxos inteligentes."
                  },
                  {
                    icon: <Calculator size={28} />,
                    tag: "Pós-Graduação",
                    title: "Ciências Naturais, Matemática e Estatística",
                    desc: "Foco: Precisão em modelagem financeira, cálculos tributários e auditoria automatizada."
                  },
                  {
                    icon: <Zap size={28} />,
                    tag: "Pós-Graduação",
                    title: "Energias do Futuro e Sustentabilidade",
                    desc: "Foco: Gestão estratégica de recursos e viabilidade econômica para operações comerciais."
                  },
                  {
                    icon: <Brain size={28} />,
                    tag: "Especialização Avançada",
                    title: "Neurocomputação e IA Generativa",
                    desc: "Foco: Desenvolvimento de agentes cognitivos de alta performance e interação humano-máquina avançada."
                  },
                  {
                    icon: <Terminal size={28} />,
                    tag: "Especialização Avançada",
                    title: "Engenharia de Prompts e Arquitetura Agêntica",
                    desc: "Foco: Orquestração de múltiplos agentes de IA para automação de ecossistemas complexos."
                  },
                  {
                    icon: <Cable size={28} />,
                    tag: "Formação Técnica",
                    title: "Técnico em Eletrotécnica",
                    desc: "Foco em sistemas de potência, instalações elétricas e manutenção industrial para infraestrutura crítica."
                  },
                  {
                    icon: <Component size={28} />,
                    tag: "Formação Técnica",
                    title: "Técnico em Eletrônica",
                    desc: "Estudo aplicado de circuitos, componentes semicondutores e hardware para sistemas inteligentes."
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.07] transition-all group hover:border-primary/30"
                  >
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all duration-500">
                        <div className="text-primary group-hover:scale-110 transition-transform duration-500">
                          {item.icon}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black tracking-[0.2em] text-primary/80 uppercase">{item.tag}</span>
                        <h3 className="text-base font-black text-white tracking-tight uppercase leading-tight">{item.title}</h3>
                        <p className="text-xs text-white/50 leading-relaxed pt-2 italic">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Statement */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full bg-white/[0.02] border border-white/5 rounded-[3rem] p-6 lg:p-16 mb-16 relative group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-sm lg:text-4xl font-black text-primary leading-tight uppercase italic tracking-wider">
                      MULTIDISCIPLINARIDADE
                    </h2>
                    <h2 className="text-white text-sm lg:text-4xl font-black leading-tight uppercase italic tracking-wider">
                      E ENGENHARIA DE NEGÓCIOS
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-1 bg-primary shadow-[0_0_15px_rgba(0,163,255,0.8)]" />
                    <div className="w-3 h-1 bg-white/20" />
                  </div>
                </div>
                
                <div className="w-full">
                  <p className="text-white/80 text-xs lg:text-xl leading-relaxed italic font-medium text-justify break-words">
                    "David atua na vanguarda da tecnologia aplicada à gestão, onde seu trabalho como Engenheiro de Sistemas integra o rigor analítico da Física e da Inteligência Artificial à automação de processos. O <strong>Victor's Smart Estoque v2.0</strong> é a materialização desta jornada: uma solução de engenharia desenhada para a excelência operacional e rentabilidade estratégica."
                  </p>
                </div>

                <div className="pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40">
                  <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] font-black text-white uppercase justify-center md:justify-start">
                    <Globe size={14} className="text-primary"/> 
                    <span>GLOBAL OPERATIONS</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] font-black text-white uppercase justify-center">
                    <Rocket size={14} className="text-primary"/> 
                    <span>HIGH PERFORMANCE</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] font-black text-white uppercase justify-center md:justify-end">
                    <Sigma size={14} className="text-primary"/>
                    <span>SCIENTIFIC PROTOCOL</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-12 pb-32 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/10">
               <span>Systems Architecture</span>
               <div className="w-1 h-1 bg-white/10 rounded-full" />
               <span>David Ferreira</span>
               <div className="w-1 h-1 bg-white/10 rounded-full" />
               <span>v2.4.2 Smart Infrastructure</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
