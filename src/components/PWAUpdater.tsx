import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export const PWAUpdater = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast('Nova versão disponível!', {
        description: 'O sistema foi atualizado com novos patches táticos. Deseja aplicar agora?',
        action: {
          label: 'ATUALIZAR',
          onClick: () => updateServiceWorker(true),
        },
        icon: <RefreshCw className="h-4 w-4 animate-spin text-primary" />,
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};
