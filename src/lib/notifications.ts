const ASKED_KEY = 'gympal.notif.asked';

async function postToSW(message: object) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage(message);
  } catch (e) {
    console.warn('[notifications] SW message failed:', e);
  }
}

export async function initNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  // Already granted → just (re)schedule, covers SW restarts
  if (Notification.permission === 'granted') {
    await navigator.serviceWorker.ready;
    await postToSW({ type: 'SCHEDULE_NOTIFICATION', hour: 7, minute: 0 });
    return;
  }

  // Blocked → do nothing
  if (Notification.permission === 'denied') return;

  // Only ask once — don't spam if user dismissed without answering
  if (localStorage.getItem(ASKED_KEY)) return;
  localStorage.setItem(ASKED_KEY, '1');

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    await navigator.serviceWorker.ready;
    await postToSW({ type: 'SCHEDULE_NOTIFICATION', hour: 7, minute: 0 });
  }
}
