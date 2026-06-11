/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();

// ─── Precaching ────────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Runtime Caching ──────────────────────────────────────────────────────────

// Navigation: NetworkFirst (matches original config)
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html',
      networkTimeoutSeconds: 3,
    })
  )
);

// Assets: StaleWhileRevalidate
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'assets' })
);

// Images: CacheFirst with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

// Google Fonts: CacheFirst
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  })
);

// ─── Notification Scheduling ───────────────────────────────────────────────────

let notifTimeout: ReturnType<typeof setTimeout> | null = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data?.type) return;

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    if (notifTimeout) clearTimeout(notifTimeout);
    scheduleNext(data.hour as number, data.minute as number);
  }

  if (data.type === 'CANCEL_NOTIFICATION') {
    if (notifTimeout) {
      clearTimeout(notifTimeout);
      notifTimeout = null;
    }
  }
});

function scheduleNext(hour: number, minute: number) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If target time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  notifTimeout = setTimeout(() => {
    self.registration.showNotification('MyGymPal 💪', {
      body: "Don't forget to log your workout today! Your streak awaits. 🔥",
      icon: '/pwa-192.png',
      badge: '/favicon.ico',
      tag: 'workout-reminder',
      renotify: true,
      requireInteraction: false,
      data: { url: '/' },
    } as NotificationOptions);

    // Auto-reschedule for next day
    scheduleNext(hour, minute);
  }, delay);
}

// ─── Notification Click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client && client.url === '/') {
            return (client as WindowClient).focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data?.url || '/');
        }
      })
  );
});

// ─── Push (future-proof if you add backend later) ─────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'MyGymPal', {
      body: data.body,
      icon: '/pwa-192.png',
      tag: 'push-notification',
      data: { url: data.url || '/' },
    } as NotificationOptions)
  );
});
