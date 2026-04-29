import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, TrendingUp, Package, Sparkles } from "lucide-react";

import { useStore } from "@/store/useStore";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const toneClass = {
  danger: "bg-danger/15 text-danger ring-danger/30",
  ai: "bg-ai/15 text-ai ring-ai/30",
  success: "bg-success/15 text-success ring-success/30",
  primary: "bg-primary/15 text-primary ring-primary/30",
};

const getIcon = (tone: string) => {
  switch (tone) {
    case 'danger': return AlertTriangle;
    case 'ai': return Sparkles;
    case 'success': return TrendingUp;
    default: return Package;
  }
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
};

export const NotificationsPanel = ({ open, onClose }: NotificationsPanelProps) => {
  const { notifications, markAllNotificationsRead, clearNotifications } = useStore();

  return (
    <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="glass-panel-strong fixed right-3 top-20 z-[101] w-[92%] max-w-sm overflow-hidden rounded-2xl border-2 border-primary/30"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <div className="font-mono-tactical text-[10px] uppercase tracking-[0.3em] text-primary">
                Central de Alertas
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-sm font-mono-tactical text-muted-foreground uppercase">Nenhuma notificação</li>
            )}
            {notifications.map((n) => {
              const Icon = getIcon(n.tone);
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-border/30 px-4 py-3 last:border-0 hover:bg-primary/5 ${n.read ? 'opacity-60' : 'opacity-100'}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClass[n.tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
                      <span className="font-mono-tactical text-[10px] text-muted-foreground">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex items-center divide-x divide-border/50 border-t border-border/50 bg-background/30">
            <button 
              onClick={() => markAllNotificationsRead()}
              className="flex-1 py-3 font-mono-tactical text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5 hover:text-glow-cyan transition-all"
            >
              Marcar Lidos
            </button>
            <button 
              onClick={() => clearNotifications()}
              className="flex-1 py-3 font-mono-tactical text-[10px] uppercase tracking-widest text-danger hover:bg-danger/5 hover:text-glow-danger transition-all"
            >
              Limpar Tudo
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
  );
};
