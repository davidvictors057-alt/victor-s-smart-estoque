import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, Menu, Wifi, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { VictorsLogo } from "@/components/VictorsLogo";
import { useApp } from "@/context/AppContext";
import { SideMenu } from "@/components/SideMenu";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useStore } from "@/store/useStore";

export const TopBar = () => {
  const { role } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications, notifOpen, setNotifOpen } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-black-piano neon-blue-border relative z-30 flex items-center justify-between rounded-2xl px-5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,163,255,0.6)]"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <VictorsLogo size="sm" />

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl bg-success/10 border border-success/30 px-3 py-1.5 sm:flex shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            <Wifi className="h-3.5 w-3.5 text-success animate-pulse" />
            <span className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.2em] text-success">
              {role === "admin" ? "MCP-PRO" : "ONLINE"}
            </span>
          </div>
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/70 transition-all hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(0,163,255,0.6)]"
            aria-label="Notificações"
          >
            <motion.div
              animate={unreadCount > 0 ? {
                rotate: [0, -15, 15, -15, 15, 0],
                transition: { repeat: Infinity, duration: 1.5, repeatDelay: 2 }
              } : {}}
            >
              <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-primary shadow-glow-cyan" : ""}`} />
            </motion.div>
            
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] font-black text-white border-2 border-black shadow-[0_0_10px_rgba(239,68,68,1)]"
              >
                {unreadCount > 9 ? "+9" : unreadCount}
              </motion.span>
            )}
          </button>

          <button
            onClick={() => {
              // Local logout is much faster
              useStore.getState().setCurrentUser(null);
              if ((window as any).appNavigation) {
                (window as any).appNavigation.setScreen("splash");
              }
              toast.success("SESSÃO ENCERRADA", { 
                description: "Terminal Victor AI desconectado com sucesso." 
              });
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger transition-all hover:bg-danger hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </motion.header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};
