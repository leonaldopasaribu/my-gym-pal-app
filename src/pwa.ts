import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import { initNotifications } from './lib/notifications';

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

  // Init notification schedule after SW is ready
  // Small delay to ensure SW has activated
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(() => initNotifications())
      .catch(() => {
        // Silent fail — notifications are non-critical
      });
  }
}
