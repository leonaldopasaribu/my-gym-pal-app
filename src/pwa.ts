import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

export function setupPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Update available', {
        description: 'A new version of My Gym Pal is ready.',
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
