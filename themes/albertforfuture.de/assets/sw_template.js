var dict = {
{{ range .Site.Pages }}
  "{{ .RelPermalink }}": "{{ ((.OutputFormats.Get "RawHTML").RelPermalink) }}?{{ sha256 .Plain }}",
{{ end }}
}

self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '{{ .Site.BaseURL }}/shell/?v=cafebabe' // todo only download if changed
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('activate');
  self.clients.claim();
});

// TODO custom 404 page
self.addEventListener('fetch', (event) => {
  var pathname = new URL(event.request.url).pathname;
  console.log('fetch ', pathname);
  console.log('fetch ', dict[pathname]);
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request).then((response) => {
        return caches.open('v1').then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});


self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Push Codelab';
  const options = {
    body: 'Yay it works.',
    icon: '{{ (resources.Get "192.webp" | fingerprint).Permalink }}',
    badge: '{{ (resources.Get "192.webp" | fingerprint).Permalink }}'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://developers.google.com/web/')
  );
});
