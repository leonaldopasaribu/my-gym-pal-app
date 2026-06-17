import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

export function setupPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Update available', {
        description: 'New version of My Gym Pal is ready to install.',
        action: {
          label: 'Reload',
          onClick: () => updateSW(true),
        },
        duration: Infinity,
      });
    },

    onOfflineReady() {
      toast.success('Ready to use offline 💪');
    },
  });
}
