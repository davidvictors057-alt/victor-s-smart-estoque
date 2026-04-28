import { motion } from "framer-motion";
import { 
  Settings, 
  Bell, 
  Smartphone, 
  Shield, 
  Database, 
  Cloud, 
  ChevronRight, 
  Zap, 
  Lock,
  Eye,
  LogOut,
  AppWindow,
  AlertOctagon,
  MessageCircle,
  History
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityLogsModal } from "@/components/ActivityLogsModal";
import { PurgeConfirmationModal } from "@/components/PurgeConfirmationModal";

export const ConfigView = () => {
  const { appSettings, updateAppSetting, clearCache, fetchAll, lastSync, currentUser } = useStore();
  const [supportPhone, setSupportPhone] = useState(appSettings.support_whatsapp || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [syncTime, setSyncTime] = useState("Nunca sincronizado");

  useEffect(() => {
    setSupportPhone(appSettings.support_whatsapp || "");
  }, [appSettings.support_whatsapp]);

  useEffect(() => {
    if (lastSync) {
      const interval = setInterval(() => {
        setSyncTime(`há ${formatDistanceToNow(new Date(lastSync), { locale: ptBR })}`);
      }, 10000);
      setSyncTime(`há ${formatDistanceToNow(new Date(lastSync), { locale: ptBR })}`);
      return () => clearInterval(interval);
    }
  }, [lastSync]);

  const handleSavePhone = async () => {
    try {
      await updateAppSetting("support_whatsapp", supportPhone);
      toast.success("CONTATO ATUALIZADO", { description: "Linha Vermelha sincronizada com sucesso." });
    } catch (err) {
      toast.error("ERRO NA SINCRONIZAÇÃO", { description: "Não foi possível atualizar o contato." });
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchAll();
      toast.success("SINCRONIA COMPLETA", { description: "Todos os dados foram atualizados com a nuvem." });
    } catch (err) {
      toast.error("FALHA NA SINCRONIA");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-24">
      {/* Settings Header - Thick Neon */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black-piano neon-blue-border flex items-center gap-4 rounded-[2rem] p-6 shadow-2xl"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black shadow-glow-cyan animate-pulse-cyan">
          <Settings className="h-8 w-8" />
        </div>
        <div>
          <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">SYSTEM PARAMS</div>
          <div className="text-2xl font-black text-white tracking-tighter text-glow-cyan">Configurações</div>
        </div>
      </motion.header>

      {/* Settings Groups - Thick Neon Sections */}
      <div className="space-y-6">
        <SettingsGroup title="CENTRAL DE SEGURANÇA" icon={Shield}>
          <SettingsItem 
            icon={Lock} 
            label="Credenciais de Acesso" 
            sub="Controle de logins e sessões ativas" 
            onClick={() => {
              if ((window as any).appNavigation) {
                (window as any).appNavigation.setAdminTab("users");
                toast.info("ACESSO RÁPIDO", { description: "Navegando para gestão de equipe." });
              }
            }}
          />
          <SettingsItem 
            icon={Eye} 
            label="Logs de Atividade" 
            sub="Rastreamento completo de movimentações" 
            badge="ACTIVE"
            onClick={() => setLogsOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="HARDWARE & PERIFÉRICOS" icon={Smartphone}>
          <SettingsItem 
            icon={Zap} 
            label="Modo de Scanner" 
            sub="Otimização de hardware para baixa luz" 
            hasToggle 
            defaultChecked={appSettings.scanner_mode !== false}
            onToggle={(val: boolean) => updateAppSetting("scanner_mode", val)}
          />
          <SettingsItem 
            icon={AppWindow} 
            label="Interface HUD" 
            sub="Exibir notificações críticas em tempo real" 
            hasToggle 
            defaultChecked={appSettings.hud_notifications !== false}
            onToggle={(val: boolean) => updateAppSetting("hud_notifications", val)}
          />
        </SettingsGroup>

        <SettingsGroup title="DADOS & CLOUD" icon={Database}>
          <SettingsItem 
            icon={Cloud} 
            label="Sincronização Remota" 
            sub={`Última atualização: ${syncTime}`} 
            onClick={handleManualSync}
            badge={isSyncing ? "SYNCING..." : undefined}
          />
          <SettingsItem 
            icon={AlertOctagon} 
            label="Limpar Memória Local" 
            sub="Resolve erros de armazenamento cheio" 
            onClick={() => {
              if (confirm("Isso irá reiniciar o terminal e limpar dados temporários. Continuar?")) {
                clearCache();
                toast.success("CACHE PURIFICADO", { description: "A memória local foi zerada." });
              }
            }}
            tone="danger"
          />
          
          {currentUser?.full_name?.toLowerCase().includes("david") && (
            <SettingsItem 
              icon={Zap} 
              label="Reiniciar Dados do Sistema" 
              sub="Apaga logs de movimentos e notificações" 
              onClick={() => setPurgeOpen(true)}
              tone="danger"
            />
          )}
        </SettingsGroup>

        <SettingsGroup title="SUPORTE & EMERGÊNCIA" icon={AlertOctagon}>
          <div className="space-y-4 p-2">
            <div className="space-y-2">
              <label className="font-mono-tactical text-[9px] uppercase tracking-widest text-white/40 ml-1">WhatsApp da Linha Vermelha</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <input 
                    type="text" 
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="5511999999999"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-4 text-sm text-white focus:border-primary focus:outline-none transition-all focus:bg-white/[0.08]"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePhone}
                  className="bg-primary text-black px-6 rounded-2xl font-mono-tactical text-[10px] font-black uppercase tracking-widest hover:shadow-glow-cyan transition-all"
                >
                  SALVAR
                </motion.button>
              </div>
              <p className="font-mono-tactical text-[8px] text-white/20 uppercase tracking-widest mt-2 px-1">
                Este número será utilizado para o botão de emergência tática de todos os funcionários.
              </p>
            </div>
          </div>
        </SettingsGroup>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            useStore.getState().setCurrentUser(null);
            if ((window as any).appNavigation) {
              (window as any).appNavigation.setScreen("splash");
            }
            toast.error("TERMINAL ENCERRADO", { description: "Sessão finalizada pelo administrador." });
          }}
          className="bg-black-piano neon-red-border active:bg-red-glow flex w-full items-center justify-center gap-3 rounded-[2rem] py-7 text-sm font-black uppercase tracking-[0.4em] text-danger border-[3px] border-danger/20 hover:border-danger hover:bg-danger/10 transition-all shadow-xl"
        >
          <LogOut className="h-5 w-5" />
          ENCERRAR TERMINAL
        </motion.button>
      </div>

      <ActivityLogsModal open={logsOpen} onClose={() => setLogsOpen(false)} />
      <PurgeConfirmationModal open={purgeOpen} onClose={() => setPurgeOpen(false)} />
    </div>
  );
};

const SettingsGroup = ({ title, icon: Icon, children }: any) => (
  <motion.section
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-black-piano neon-blue-border group overflow-hidden rounded-[2.5rem] p-6 shadow-2xl hover:shadow-glow-cyan-sm transition-all"
  >
    <div className="mb-6 flex items-center gap-3 px-2">
      <div className="h-2 w-2 rounded-full bg-primary shadow-glow-cyan" />
      <div className="font-mono-tactical text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-primary transition-colors">{title}</div>
    </div>
    <div className="space-y-4">{children}</div>
  </motion.section>
);

const SettingsItem = ({ icon: Icon, label, sub, hasToggle, defaultChecked, onToggle, badge, onClick, tone }: any) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onToggle) onToggle(newValue);
  };

  return (
    <div 
      onClick={onClick}
      className={`group flex items-center gap-5 rounded-3xl bg-white/[0.02] p-4 ring-1 ring-white/5 hover:bg-white/[0.05] transition-all ${onClick ? 'cursor-pointer' : ''} ${
        tone === 'danger' ? 'hover:ring-danger/40' : 'hover:ring-primary/40'
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20 transition-all ${
        tone === 'danger' ? 'group-hover:text-danger group-hover:bg-danger/10' : 'group-hover:text-primary group-hover:bg-primary/10'
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={`truncate text-base font-black text-white transition-colors tracking-tight ${
            tone === 'danger' ? 'group-hover:text-danger' : 'group-hover:text-primary'
          }`}>{label}</div>
          {badge && (
            <span className={`font-mono-tactical rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ring-1 ${
              badge.includes("SYNC") ? "bg-primary/20 text-primary ring-primary/40 animate-pulse" : "bg-success/20 text-success ring-success/40"
            }`}>
              {badge}
            </span>
          )}
        </div>
        <div className="truncate font-mono-tactical text-[8px] font-black uppercase tracking-widest text-white/20 mt-1">{sub}</div>
      </div>
      {hasToggle ? (
        <div 
          onClick={handleToggle}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 group-hover:bg-white/20"
        >
          <span className={`h-4 w-4 transform rounded-full transition-transform ${isChecked ? "translate-x-6 bg-success shadow-glow-success" : "translate-x-1 bg-white/20"}`} />
        </div>
      ) : (
        <ChevronRight className={`h-4 w-4 text-white/10 group-hover:text-white/40 transition-all ${
          tone === 'danger' ? 'group-hover:text-danger/60' : ''
        }`} />
      )}
    </div>
  );
};
