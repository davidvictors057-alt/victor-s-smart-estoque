import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export const NetworkMonitor = () => {
  const fetchAll = useStore((state) => state.fetchAll);
  const lastOnlineSync = useStore((state) => state.lastOnlineSync);

  useEffect(() => {
    const handleOnline = () => {
      toast.success("CONEXÃO RESTABELECIDA", {
        description: "Iniciando sincronização automática de dados.",
        icon: "📡"
      });
      fetchAll();
    };

    const handleOffline = () => {
      toast.error("MODO OFFLINE ATIVO", {
        description: "As alterações serão salvas localmente e sincronizadas quando houver sinal.",
        icon: "⚠️"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync every 5 minutes if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        const now = new Date();
        const lastSync = lastOnlineSync ? new Date(lastOnlineSync) : null;
        
        // If more than 5 minutes since last sync
        if (!lastSync || (now.getTime() - lastSync.getTime()) > 5 * 60 * 1000) {
          console.log("🕒 Sincronia automática periódica iniciada...");
          fetchAll();
        }
      }
    }, 60 * 1000); // Check every minute

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [fetchAll, lastOnlineSync]);

  return null;
};
