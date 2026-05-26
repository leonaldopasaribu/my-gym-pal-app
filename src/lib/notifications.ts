// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotifPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const PREFS_KEY = 'gympal.notif.v1';

export function getPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, hour: 19, minute: 0 };
  } catch {
    return { enabled: false, hour: 19, minute: 0 };
  }
}

export function savePrefs(prefs: NotifPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ─── Service Worker Communication ─────────────────────────────────────────────

async function postToSW(message: object) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage(message);
  } catch (e) {
    console.warn('[notifications] SW message failed:', e);
  }
}

export async function scheduleNotification(hour: number, minute: number) {
  await postToSW({ type: 'SCHEDULE_NOTIFICATION', hour, minute });
}

export async function cancelNotification() {
  await postToSW({ type: 'CANCEL_NOTIFICATION' });
}

// ─── Apply prefs to SW ────────────────────────────────────────────────────────

export async function applyPrefs(prefs: NotifPrefs) {
  savePrefs(prefs);
  if (prefs.enabled && getPermission() === 'granted') {
    await scheduleNotification(prefs.hour, prefs.minute);
  } else {
    await cancelNotification();
  }
}

// ─── Init on app start ────────────────────────────────────────────────────────

export async function initNotifications() {
  const prefs = getPrefs();
  if (prefs.enabled && getPermission() === 'granted') {
    // Wait for SW to be ready before sending schedule
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        scheduleNotification(prefs.hour, prefs.minute);
      });
    }
  }
}
