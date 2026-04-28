import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, LogOut, Settings, HelpCircle, Moon, Bell, Palette, BookOpen, ChevronRight, Fingerprint, RefreshCcw } from "lucide-react";
import { RoleToggle } from "@/components/RoleToggle";
import { VictorsLogo } from "@/components/VictorsLogo";
import { useApp } from "@/context/AppContext";
import { SupportModal } from "./SupportModal";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { ChangePinModal } from "./ChangePinModal";
import { toast } from "sonner";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export const SideMenu = ({ open, onClose }: SideMenuProps) => {
  const { setScreen, role, setAdminTab, setEmployeeTab, setProfileTab } = useApp();
  const { notifications, currentUser, setCurrentUser, setNotifOpen, supportOpen, setSupportOpen, changePinOpen, setChangePinOpen, manualOpen, setManualOpen, lastSync, lastSyncUser, fetchAll } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isSyncing, setIsSyncing] = useState(false);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isStealth = localStorage.getItem("tactical-stealth") === "true";
    setIsDark(isStealth);
    if (isStealth) {
      document.documentElement.classList.add("mode-stealth");
    }
  }, []);

  const toggleStealth = () => {
    const newState = !isDark;
    setIsDark(newState);
    localStorage.setItem("tactical-stealth", newState.toString());
    if (newState) {
      document.documentElement.classList.add("mode-stealth");
    } else {
      document.documentElement.classList.remove("mode-stealth");
    }
  };

  const handleItemClick = (label: string) => {
    switch (label) {
      case "Modo noturno":
        toggleStealth();
        break;
      case "Trocar Senha":
        setChangePinOpen(true);
        onClose();
        break;
      case "Suporte":
        setSupportOpen(true);
        onClose();
        break;
      case "Notificações":
        setNotifOpen(true);
        onClose();
        break;
      case "Configurações":
        if (role === "admin") {
          setAdminTab("config");
        } else {
          setEmployeeTab("profile");
          setProfileTab("general");
        }
        setScreen("app"); 
        onClose();
        break;
      case "Manual operacional":
        setManualOpen(true);
        onClose();
        break;
      case "Aparência":
        if (role === "admin") {
          setAdminTab("profile");
        } else {
          setEmployeeTab("profile");
        }
        setProfileTab("appearance");
        onClose();
        break;
      case "Sincronizar Agora":
        setIsSyncing(true);
        fetchAll().finally(() => {
          setIsSyncing(false);
          toast.success("SINCRONIA TÁTICA CONCLUÍDA", { 
            description: "Todos os dados foram atualizados com o servidor." 
          });
        });
        break;
      default:
        onClose();
    }
  };

  const items = [
    { icon: RefreshCcw, label: "Sincronizar Agora", trailing: isSyncing ? "..." : undefined },
    { icon: Bell, label: "Notificações", badge: unreadCount > 0 ? unreadCount.toString() : undefined },
    { icon: Fingerprint, label: "Trocar Senha" },
    { icon: Palette, label: "Aparência" },
    { icon: Settings, label: "Configurações" },
    { icon: BookOpen, label: "Manual operacional" },
    { icon: HelpCircle, label: "Suporte" },
    { icon: Moon, label: "Modo noturno", trailing: isDark ? "ON" : "OFF" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="bg-black-piano neon-blue-border fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col rounded-r-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <VictorsLogo size="sm" />
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {currentUser?.role === "admin" && (
              <div className="px-5 pb-3">
                <div className="font-mono-tactical mb-2 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  Controle de acesso
                </div>
                <RoleToggle />
              </div>
            )}

            <nav className="mt-2 flex-1 overflow-y-auto px-3">
              <div className="font-mono-tactical mb-2 px-2 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Geral
              </div>
              <ul className="space-y-1">
                {items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <li key={it.label}>
                      <button
                        onClick={() => handleItemClick(it.label)}
                        className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-all duration-300 hover:bg-white/5 hover:neon-blue-border-thin shadow-none hover:shadow-[0_0_15px_rgba(0,163,255,0.1)]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:shadow-[0_0_15px_rgba(0,163,255,0.6)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1 font-bold group-hover:translate-x-1 transition-transform">{it.label}</span>
                        {it.badge && (
                          <span className="rounded-full bg-danger px-2 py-0.5 font-mono-tactical text-[10px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                            {it.badge}
                          </span>
                        )}
                        {it.trailing && (
                          <span className="font-mono-tactical text-[10px] font-black uppercase tracking-widest text-success">
                            {it.trailing}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-border/50 p-4">
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  setCurrentUser(null);
                  setScreen("splash");
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/10 py-3 text-sm font-bold text-danger transition-colors hover:bg-danger/20"
              >
                <LogOut className="h-4 w-4" />
                ENCERRAR TURNO
              </button>
              <div className="mt-4 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="font-mono-tactical text-[9px] uppercase tracking-[0.3em] text-white/90">
                    Último Sincronismo
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[12px] font-black text-primary uppercase tracking-wider">
                    {lastSync ? lastSync.toLocaleTimeString('pt-BR') : "--:--:--"}
                  </div>
                  <div className="text-[10px] font-bold text-white uppercase tracking-tighter opacity-80">
                    Operador: {lastSyncUser || 'Sistema'}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center font-mono-tactical text-[10px] font-black uppercase tracking-[0.3em] text-white">
                Victor's Smart Estoque v2.0 · PWA-PRO
              </div>
            </div>
          </motion.aside>

        </>
      )}
    </AnimatePresence>
  );
};
