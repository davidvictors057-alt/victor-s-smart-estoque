import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Delete, CornerDownLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { VictorsLogo } from "@/components/VictorsLogo";
import { useApp } from "@/context/AppContext";
import { useStore, Profile } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRef } from "react";

export const SplashScreen = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const store = useStore();
  const { profiles, fetchProfiles, fetchAppSettings, fetchAll, setCurrentUser, updateProfile } = store;
  const [pin, setPin] = useState<string>("");
  const [loginMode, setLoginMode] = useState<'pin' | 'password'>('pin');
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const { setScreen, setRole } = useApp();

  useEffect(() => {
    console.log("🚀 [SplashScreen] Iniciando carregamento de perfis...");
    if (typeof fetchProfiles === 'function') {
      fetchProfiles().catch(err => console.error("❌ [SplashScreen] Erro ao carregar perfis:", err));
    } else {
      console.error("❌ [SplashScreen] fetchProfiles não é uma função no store!");
    }
    
    if (typeof fetchAppSettings === 'function') {
      fetchAppSettings().catch(err => console.error("❌ [SplashScreen] Erro ao carregar configurações:", err));
    }
  }, [fetchProfiles, fetchAppSettings]);

  const activeProfiles = profiles.filter(p => p.full_name !== 'Carol Silva');

  useEffect(() => {
    if (activeProfiles.length > 0 && !selectedEmployee) {
      setSelectedEmployee(activeProfiles[0].id);
    }
  }, [activeProfiles, selectedEmployee]);

  const handleLogin = async (customPin?: string) => {
    const currentPin = customPin || pin;
    const employee = activeProfiles.find(p => p.id === selectedEmployee);
    
    if (!employee || !currentPin) return;
    
    setAuthenticating(true);
    setError(false);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: employee.email || '',
        password: currentPin,
      });

      if (authError) throw authError;

      if (data.user) {
        await updateProfile(employee.id, { status: 'online' });
        setCurrentUser(employee);
        setRole(employee.role === 'admin' ? 'admin' : 'employee');
        setScreen("app");
        fetchAll(); // Start full sync after login
        toast.success(`Bem-vindo, ${employee.full_name.split(' ')[0]}!`);
      }
    } catch (err: any) {
      console.error("🚨 [Login] Erro fatal:", err);
      setError(true);
      if (!customPin) setPin("");
      toast.error("FALHA NA CONEXÃO TÁTICA", {
        description: err.message || "Credenciais inválidas ou timeout."
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const forceClear = () => {
    localStorage.clear();
    window.location.reload();
  };

  const scrollEmployees = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNumberClick = (num: string) => {
    if (authenticating || loginMode === 'password') return;
    setError(false);
    setPin(prev => prev.length < 12 ? prev + num : prev);
  };

  const handleDelete = () => {
    if (authenticating) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handleBiometric = async () => {
    const david = activeProfiles.find(p => p.full_name.toLowerCase().includes('david'));
    if (david && david.email && david.pin) {
      await handleLogin(david.pin);
      if (!error) toast.success("Biometria aceita. Bem-vindo!");
    } else {
      toast.error("PERFIL NÃO LOCALIZADO");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-black"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,255,0.08)_0%,transparent_70%)]" />

      {/* FIXED HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 flex flex-none flex-col items-center pt-8 pb-2 sm:pt-12"
      >
        <VictorsLogo size={window.innerWidth > 640 ? "xl" : "lg"} />
        <div className="mt-2 text-center">
          <h2 className="font-mono-tactical text-[8px] sm:text-[11px] font-bold tracking-[0.4em] text-white">
            SISTEMA DE GESTÃO DE ESTOQUE
          </h2>
        </div>
      </motion.header>

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
        <div className="flex min-h-full w-full flex-col items-center justify-center py-6 px-4">
          
          {/* Employee Selection with Navigation */}
          <div className="relative mb-6 flex w-full max-w-4xl items-center">
            <button 
              onClick={() => scrollEmployees('left')}
              className="absolute left-0 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-primary/20 hover:text-primary active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <motion.div
              ref={scrollRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex w-full items-center gap-4 sm:gap-10 overflow-x-auto px-12 py-4 no-scrollbar scroll-smooth"
            >
              {activeProfiles.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`group relative flex flex-none flex-col items-center transition-all duration-300 ${
                    selectedEmployee === emp.id ? "scale-110" : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                  }`}
                >
                  <div className={`relative h-12 w-12 sm:h-18 sm:w-18 overflow-hidden rounded-full border-2 transition-all duration-500 ${
                    selectedEmployee === emp.id ? "border-primary shadow-[0_0_25px_rgba(0,163,255,0.4)]" : "border-white/10"
                  }`}>
                    <img 
                      src={emp.avatar_url?.startsWith('http') ? emp.avatar_url : `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatar_url || emp.full_name}`} 
                      alt={emp.full_name} 
                      className="h-full w-full object-cover bg-black-piano" 
                    />
                  </div>
                  <span className="mt-2 font-mono-tactical text-[7px] sm:text-[10px] font-bold tracking-wider text-white uppercase">
                    {emp.full_name.split(' ')[0]}
                  </span>
                  {selectedEmployee === emp.id && (
                    <motion.div layoutId="active-emp-dot" className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </motion.div>

            <button 
              onClick={() => scrollEmployees('right')}
              className="absolute right-0 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-primary/20 hover:text-primary active:scale-90"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Login Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black-piano neon-red-border relative w-full max-w-[340px] sm:max-w-[480px] rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] sm:scale-105"
          >
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <div className="w-full text-center">
                <h3 className="mb-2 font-mono-tactical text-[10px] sm:text-xs font-black tracking-[0.2em] text-white/95">
                  TELA DE LOGIN DO FUNCIONÁRIO
                </h3>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <div className="w-full space-y-4">
                <div className="flex flex-col items-center">
                  <span className="mb-3 font-mono-tactical text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-white uppercase">
                    {loginMode === 'pin' ? 'Digite seu PIN para acessar:' : 'Digite sua Senha para acessar:'}
                  </span>
                  
                  <div className="relative w-full">
                    <input
                      type="password"
                      readOnly={loginMode === 'pin'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder={loginMode === 'pin' ? "AGUARDANDO PIN..." : "DIGITE SUA SENHA..."}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3 sm:py-5 text-center font-mono-tactical text-lg sm:text-2xl font-black tracking-[0.5em] text-primary placeholder:text-white placeholder:tracking-wider focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    <div className="absolute inset-0 -z-10 bg-primary/5 blur-xl" />
                  </div>
                </div>

                {loginMode === 'pin' && (
                  <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                      <motion.button
                        key={num}
                        whileHover={{ 
                          scale: 1.05, 
                          backgroundColor: "rgba(0,163,255,0.15)",
                          borderColor: "rgba(0,163,255,0.6)",
                          boxShadow: "0 0 20px rgba(0,163,255,0.3)"
                        }}
                        whileTap={{ 
                          scale: 0.95,
                          backgroundColor: "rgba(0,163,255,0.3)",
                          borderColor: "rgba(0,163,255,0.8)",
                          boxShadow: "0 0 30px rgba(0,163,255,0.5)"
                        }}
                        onClick={() => handleNumberClick(num.toString())}
                        className="flex h-12 sm:h-16 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-xl sm:text-2xl font-black text-white transition-all hover:text-primary"
                      >
                        {num}
                      </motion.button>
                    ))}
                    <motion.button
                      whileHover={{ 
                        scale: 1.05, 
                        backgroundColor: "rgba(255,59,48,0.15)",
                        borderColor: "rgba(255,59,48,0.6)",
                        boxShadow: "0 0 20px rgba(255,59,48,0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        backgroundColor: "rgba(255,59,48,0.3)",
                        borderColor: "rgba(255,59,48,0.8)",
                        boxShadow: "0 0 30px rgba(255,59,48,0.5)"
                      }}
                      onClick={handleDelete}
                      className="flex h-12 sm:h-16 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white transition-all hover:text-danger"
                    >
                      <Delete className="h-5 w-5" />
                    </motion.button>
                    
                    <div className="col-span-3 grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ 
                          scale: 1.02, 
                          backgroundColor: "rgba(166, 255, 0, 0.2)", 
                          borderColor: "#a6ff00",
                          boxShadow: "0 0 20px rgba(166, 255, 0, 0.3)"
                        }}
                        whileTap={{ 
                          scale: 0.98,
                          backgroundColor: "rgba(166, 255, 0, 0.4)",
                          boxShadow: "0 0 30px rgba(166, 255, 0, 0.5)"
                        }}
                        onClick={() => {
                          setLoginMode('password');
                          setPin('');
                        }}
                        className="flex items-center justify-center rounded-xl border border-[#a6ff00]/20 bg-[#a6ff00]/5 py-3 sm:py-4 transition-all"
                      >
                        <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#a6ff00] uppercase">
                          MODO ALFANUMÉRICO
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ 
                          scale: 1.02, 
                          backgroundColor: "rgba(0,163,255,0.2)",
                          borderColor: "rgba(0,163,255,0.6)",
                          boxShadow: "0 0 20px rgba(0,163,255,0.3)"
                        }}
                        whileTap={{ 
                          scale: 0.98,
                          backgroundColor: "rgba(0,163,255,0.4)",
                          boxShadow: "0 0 30px rgba(0,163,255,0.6)"
                        }}
                        onClick={() => handleLogin()}
                        disabled={!pin || authenticating}
                        className="flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 py-3 sm:py-4 text-primary transition-all shadow-[0_0_15px_rgba(0,163,255,0.2)]"
                      >
                        {authenticating ? (
                           <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <CornerDownLeft className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {loginMode === 'password' && (
                  <div className="flex flex-col gap-3">
                    <motion.button
                      whileHover={{ 
                        scale: 1.02, 
                        backgroundColor: "rgba(0,163,255,0.2)",
                        borderColor: "rgba(0,163,255,0.6)",
                        boxShadow: "0 0 20px rgba(0,163,255,0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        backgroundColor: "rgba(0,163,255,0.4)",
                        boxShadow: "0 0 30px rgba(0,163,255,0.6)"
                      }}
                      onClick={() => handleLogin()}
                      disabled={!pin || authenticating}
                      className="w-full rounded-xl bg-primary py-4 font-black tracking-widest text-black shadow-[0_0_30px_rgba(0,163,255,0.3)] transition-all hover:bg-primary/90"
                    >
                      {authenticating ? "VALIDANDO..." : "ENTRAR NO SISTEMA"}
                    </motion.button>
                    <motion.button
                      whileHover={{ 
                        scale: 1.02, 
                        backgroundColor: "rgba(166, 255, 0, 0.2)", 
                        borderColor: "#a6ff00",
                        boxShadow: "0 0 20px rgba(166, 255, 0, 0.3)"
                      }}
                      whileTap={{ 
                        scale: 0.98,
                        backgroundColor: "rgba(166, 255, 0, 0.4)",
                        boxShadow: "0 0 30px rgba(166, 255, 0, 0.5)"
                      }}
                      onClick={() => {
                        setLoginMode('pin');
                        setPin('');
                      }}
                      className="mt-2 flex w-full items-center justify-center rounded-xl border border-[#a6ff00]/20 bg-[#a6ff00]/5 py-3 sm:py-4 transition-all"
                    >
                      <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#a6ff00] uppercase">
                        VOLTAR PARA MODO PIN
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Integrated Actions */}
                <div className="mt-4 flex w-full flex-col gap-3 border-t border-white/5 pt-5">
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleBiometric}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 sm:py-4 transition-all hover:border-primary/40 hover:bg-white/10"
                    >
                      <Fingerprint className="h-4 w-4 text-primary" />
                      <span className="text-[8px] sm:text-[10px] font-black tracking-wider text-white/95 uppercase">BIOMETRIA</span>
                    </motion.button>

                    <button 
                      onClick={() => toast.info("Procure o administrador para resetar seu PIN.")}
                      className="hover-neon-blue flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 sm:py-4 text-[8px] sm:text-[10px] font-black tracking-wider text-white transition-all uppercase"
                    >
                      ESQUECI O PIN
                    </button>
                  </div>


                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* FIXED FOOTER */}
      <footer className="relative z-20 flex flex-none items-center justify-center gap-2 sm:gap-4 py-6 opacity-90">
        <div className="h-[0.5px] w-4 sm:w-10 bg-white/50" />
        <p className="font-mono-tactical text-[7px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.4em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase whitespace-nowrap">
          POWERED BY GEMINI 3.1 & SUPABASE
        </p>
        <div className="h-[0.5px] w-4 sm:w-10 bg-white/50" />
      </footer>
    </motion.div>
  );
};
