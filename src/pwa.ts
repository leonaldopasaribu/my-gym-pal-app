import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com') ||
  (window.location.hostname.includes('lovable.app') &&
    window.location.hostname.startsWith('id-preview--'));

export function setupPWA() {
  // Never register SW inside Lovable preview iframes — it caches stale builds.
  if (isInIframe || isPreviewHost) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    return;
  }

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
