
/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { SyncService } from './services/sync';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// 1. Precache standard assets (được inject bởi Vite)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Cache Images (CacheFirst) - Tối ưu tốc độ tải ảnh
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache cả opaque responses (cross-origin)
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// 3. Cache Google Fonts (StaleWhileRevalidate)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
      }),
    ],
  })
);

// 4. Cache API Requests (NetworkFirst) - Ưu tiên dữ liệu mới nhất, fallback cache khi offline
registerRoute(
  ({ url }) => url.origin === 'https://script.google.com' && url.pathname.startsWith('/macros/s/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 Hours
      }),
    ],
    networkTimeoutSeconds: 10, // Fallback to cache if network is slow (10s)
  })
);

// 5. Listen to Sync Event (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === SyncService.CONSTANTS.SYNC_TAG) {
    console.log('[SW] Background Sync triggered:', event.tag);
    event.waitUntil(SyncService.processQueue());
  }
});

// 3. Handle Skip Waiting (Update SW ngay lập tức)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
