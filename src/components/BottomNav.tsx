import { motion } from "framer-motion";
import { Home, ArrowLeftRight, ClipboardList, User, BarChart3, Boxes, Settings, Brain, Users as UsersIcon, MessageSquare } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: typeof Home;
}

const employeeTabs: Tab[] = [
  { id: "scan", label: "Início", icon: Home },
  { id: "moves", label: "Movimentos", icon: ArrowLeftRight },
  { id: "users", label: "Equipe", icon: UsersIcon },
  { id: "register", label: "Cadastro", icon: ClipboardList },
];

const adminTabs: Tab[] = [
  { id: "dashboard", label: "Home", icon: BarChart3 },
  { id: "ai", label: "IA", icon: Brain },
  { id: "stock", label: "Estoque", icon: Boxes },
  { id: "moves", label: "Movs", icon: ArrowLeftRight },
  { id: "users", label: "Equipe", icon: UsersIcon },
  { id: "config", label: "Config", icon: Settings },
];

interface BottomNavProps {
  active: string;
  onChange: (id: string) => void;
}

export const BottomNav = ({ active, onChange }: BottomNavProps) => {
  const { role } = useApp();
  const tabs = role === "admin" ? adminTabs : employeeTabs;
  const accent = role === "admin" ? "ai" : "primary";

  return (
    <motion.nav
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className={`bg-black-piano neon-blue-border relative z-30 flex items-center justify-between rounded-2xl py-2 mb-2 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] px-1`}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(t.id)}
            className={`group relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 ${tabs.length > 4 ? "px-0.5" : "px-2"}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className={`absolute inset-x-1 inset-y-1 rounded-xl ${accent === "ai" ? "bg-ai/10 border-[3px] border-ai shadow-[0_0_20px_rgba(168,85,247,0.3)]" : "bg-primary/10 border-[3px] border-primary shadow-[0_0_20px_rgba(0,163,255,0.3)]"}`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? accent === "ai" ? "text-ai scale-110 shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "text-primary scale-110 shadow-[0_0_15px_rgba(0,163,255,0.4)]"
                    : "text-white/30 group-hover:text-white/60 group-hover:scale-105"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? (accent === "ai" ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "drop-shadow-[0_0_8px_rgba(0,163,255,0.8)]") : ""}`} />
              </div>
              <span
                className={`font-mono-tactical font-black uppercase transition-all duration-300 ${
                  tabs.length > 4 ? "text-[7px] tracking-tight" : "text-[9px] tracking-widest"
                } ${
                  isActive ? (accent === "ai" ? "text-ai opacity-100" : "text-primary opacity-100") : "text-white/20 opacity-0 group-hover:opacity-60"
                }`}
              >
                {t.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
};

export const useTabState = (initial: string) => useState(initial);
