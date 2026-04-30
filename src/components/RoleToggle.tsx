import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Shield, HardHat } from "lucide-react";

/**
 * Inline role toggle — used inside the side menu (Sheet),
 * not floating anymore. Floating version was blocking the bottom nav.
 */
export const RoleToggle = ({ compact = false }: { compact?: boolean }) => {
  const { role, toggleRole } = useApp();
  const isAdmin = role === "admin";

  return (
    <button
      onClick={toggleRole}
      className={`bg-black-piano neon-blue-border-thin group flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 font-mono-tactical text-[10px] uppercase tracking-widest transition-all hover:neon-blue-border shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${
        compact ? "" : ""
      }`}
    >
      <span className="text-white font-black">Perfil ativo</span>
      <div className="relative flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
        <span
          className={`relative z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-black transition-all duration-300 ${
            !isAdmin ? "text-black scale-105" : "text-white"
          }`}
        >
          <HardHat className="h-3.5 w-3.5" />
          FUNC
        </span>
        <span
          className={`relative z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-black transition-all duration-300 ${
            isAdmin ? "text-white scale-105" : "text-white"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          ADMIN
        </span>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className={`absolute inset-y-1 rounded-lg ${
            isAdmin
              ? "right-1 left-[calc(50%+2px)] bg-ai shadow-[0_0_15px_rgba(168,85,247,0.6)]"
              : "left-1 right-[calc(50%+2px)] bg-primary shadow-[0_0_15px_rgba(0,163,255,0.6)]"
          }`}
        />
      </div>
    </button>
  );
};
