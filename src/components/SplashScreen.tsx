import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Delete, CornerDownLeft } from "lucide-react";
import { VictorsLogo } from "@/components/VictorsLogo";
import { useApp } from "@/context/AppContext";
import { useStore, Profile } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PIN_LENGTH = 6;

export const SplashScreen = () => {
  const { profiles, fetchAll, setCurrentUser, updateProfile } = useStore();
  const [pin, setPin] = useState<string>("");
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState(false);

  // Sort or filter profiles as needed. Here we just take all.
  const activeProfiles = profiles;
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const { setScreen, setRole } = useApp();

  useEffect(() => {
    // Força o carregamento total ao montar a tela de login
    fetchAll();
  }, []); 

  // Debug para monitorar carregamento
  useEffect(() => {
    if (profiles.length > 0) {
      console.log(`✅ ${profiles.length} perfis carregados com sucesso.`);
    }
  }, [profiles]);

  useEffect(() => {
    if (activeProfiles.length > 0 && !selectedEmployee) {
      setSelectedEmployee(activeProfiles[0]);
    }
  }, [activeProfiles, selectedEmployee]);

  useEffect(() => {
    if (pin.length === PIN_LENGTH && selectedEmployee) {
      setAuthenticating(true);
      setError(false);

      const login = async () => {
        try {
          // Tenta logar no Supabase usando o email do perfil selecionado e o PIN como senha
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: selectedEmployee.email || '',
            password: pin,
          });

          if (authError) throw authError;

          if (data.user) {
            console.log("Login Auth efetuado com sucesso para:", selectedEmployee.full_name);
            // Update status to online
            await updateProfile(selectedEmployee.id, { status: 'online' });
            
            setCurrentUser(selectedEmployee);
            setRole(selectedEmployee.role === 'admin' ? 'admin' : 'employee');
            setScreen("app");
            toast.success(`Bem-vindo, ${selectedEmployee.full_name.split(' ')[0]}!`);
          }
        } catch (err: any) {
          console.error("Erro de Autenticação:", err.message);
          setError(true);
          setPin("");
          toast.error("ACESSO NEGADO", {
            description: "Senha inválida ou erro de conexão."
          });
        } finally {
          setAuthenticating(false);
        }
      };

      login();
    }
  }, [pin, setScreen, selectedEmployee, setRole, setCurrentUser]);

  const handlePress = (v: string) => {
    if (authenticating) return;
    setError(false);
    if (v === "back") return setPin((p) => p.slice(0, -1));
    if (pin.length < PIN_LENGTH) setPin((p) => p + v);
  };

  const handleBiometric = async () => {
    console.log("Iniciando biometria tática...");
    const david = activeProfiles.find(p => p.full_name.toLowerCase().includes('david'));

    if (david && david.email && david.pin) {
      setAuthenticating(true);
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: david.email,
          password: david.pin,
        });

        if (authError) throw authError;

        if (data.user) {
          setSelectedEmployee(david);
          setTimeout(() => {
            setCurrentUser(david);
            setRole('admin');
            setScreen("app");
            toast.success("Biometria aceita. Bem-vindo, David!");
          }, 600);
        }
      } catch (err: any) {
        console.error("Falha na biometria:", err.message);
        toast.error("FALHA NA BIOMETRIA", {
          description: "Não foi possível validar sua sessão via Auth."
        });
        setAuthenticating(false);
      }
    } else {
      toast.error("PERFIL NÃO LOCALIZADO", {
        description: "Configure seu e-mail e PIN no banco de dados."
      });
    }
  };

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-[100dvh] w-full flex-col items-center justify-start sm:justify-center overflow-y-auto custom-scrollbar bg-black pt-2 sm:pt-0"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,255,0.08)_0%,transparent_70%)]" />

      {/* Logo Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 mb-0 flex flex-col items-center"
      >
        <VictorsLogo size={window.innerWidth > 640 ? "xl" : "lg"} />
        <div className="mt-2 text-center">
          <h2 className="font-mono-tactical text-[10px] font-bold tracking-[0.4em] text-white/90">
            SISTEMA DE GESTÃO DE ESTOQUE
          </h2>
        </div>
      </motion.div>

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="z-10 mb-2 flex w-full max-w-2xl items-center justify-start gap-5 overflow-x-auto px-10 pt-4 pb-2 no-scrollbar"
      >
        {activeProfiles.map((emp, i) => (
          <button
            key={i}
            onClick={() => setSelectedEmployee(emp)}
            className={`flex flex-col items-center gap-2 transition-all ${selectedEmployee?.id === emp.id ? "scale-110 opacity-100" : "opacity-30 grayscale hover:opacity-70 hover:grayscale-0"
              }`}
          >
            <div className={`relative h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 p-1 sm:p-1.5 transition-all duration-300 ${selectedEmployee?.id === emp.id ? "border-primary shadow-[0_0_15px_rgba(0,163,255,0.4)]" : "border-white/10"
              }`}>
              <img 
                src={emp.avatar_url?.startsWith('http') 
                  ? emp.avatar_url 
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.avatar_url || emp.full_name}${emp.full_name === "Raul Seixas" ? "&skinColor=9e5622" : ""}`
                } 
                alt={emp.full_name} 
                className="h-full w-full rounded-full bg-[#1a1c1e] object-cover" 
              />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedEmployee?.id === emp.id ? "text-primary" : "text-white/40"
              }`}>
              {emp.full_name.split(" ")[0]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Main Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black-piano neon-red-border relative z-10 w-full max-w-[400px] sm:max-w-[460px] rounded-[2.5rem] p-5 sm:p-8 sm:pb-12 shadow-[0_30px_60px_rgba(0,0,0,0.8)] sm:scale-110 sm:my-6"
      >
        <div className="flex flex-col items-center gap-2 sm:gap-5">
          <div className="w-full text-center">
            <h3 className="mb-2 font-mono-tactical text-xs font-black tracking-[0.2em] text-white/95">
              TELA DE LOGIN DO FUNCIONÁRIO
            </h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-danger to-transparent opacity-40" />
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:gap-6">
            <span className={`font-mono-tactical text-[10px] font-black tracking-[0.15em] ${error ? 'text-danger animate-pulse' : 'text-white/50'}`}>
              {authenticating ? "VALIDANDO ACESSO..." : error ? "PIN INCORRETO. TENTE NOVAMENTE." : "DIGITE SEU PIN DE 6 DÍGITOS PARA ACESSAR:"}
            </span>

            {/* PIN Display Slots */}
            <div className="flex justify-center gap-1.5 sm:gap-3 w-full overflow-visible">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-7 sm:h-16 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl border transition-all duration-300 ${i < pin.length
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(0,163,255,0.3)]"
                      : "border-white/10 bg-black/40 text-white/10"
                    }`}
                >
                  {i < pin.length ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(0,163,255,1)]"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Keypad */}
          <div className="grid w-full grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k, i) => {
              const isBack = k === "back";
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handlePress(isBack ? "back" : k)}
                  className={`flex h-11 sm:h-16 min-h-[40px] items-center justify-center rounded-xl bg-black/40 border border-primary/20 text-xl sm:text-3xl font-black text-white/90 transition-all hover:bg-primary/10 hover:border-primary/50 hover:text-primary active:bg-primary/20 shadow-[inset_0_0_10px_rgba(0,163,255,0.05)] ${isBack ? "text-danger/70 hover:text-danger hover:border-danger/40" : ""
                    }`}
                >
                  {isBack ? <Delete className="h-6 w-6" /> : k}
                </motion.button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => pin.length === PIN_LENGTH && setAuthenticating(true)}
              className="relative col-span-3 flex h-11 sm:h-14 items-center justify-center rounded-xl bg-[#031a1c]/80 border border-primary/40 shadow-[inset_0_0_15px_rgba(0,163,255,0.15),0_0_20px_rgba(0,163,255,0.1)] transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[inset_0_0_25px_rgba(0,163,255,0.2),0_0_30px_rgba(0,163,255,0.3)] group overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,255,0.1)_0%,transparent_70%)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <CornerDownLeft className="h-7 w-7 text-primary drop-shadow-[0_0_12px_rgba(0,163,255,1)] transition-transform group-hover:scale-110" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Bottom Interface Actions */}
      <div className="z-10 mt-3 flex w-full max-w-[390px] gap-4 px-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleBiometric}
          className="group flex flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white/10"
        >
          <Fingerprint className="h-4 w-4 text-primary" />
          <span className="text-[9px] font-black tracking-wider text-white/95 uppercase">BIOMETRIA</span>
        </motion.button>

        <button className="hover-neon-blue flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-3 text-[9px] font-black tracking-wider text-white/50 backdrop-blur-md transition-all uppercase">
          ESQUECI O PIN
        </button>
      </div>

      <div className="mt-auto pb-2 flex items-center gap-4">
        <div className="h-[1px] w-8 bg-white/10" />
        <div className="font-mono-tactical text-[8px] font-black uppercase tracking-[0.3em] text-white/40">
          POWERED BY GEMINI 3.1 & SUPABASE
        </div>
        <div className="h-[1px] w-8 bg-white/10" />
      </div>
    </motion.div>
  );
};
