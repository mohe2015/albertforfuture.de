self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('v6').then((cache) => {
      return cache.addAll([
        '{{ (resources.Get "custom.scss" | toCSS | fingerprint).RelPermalink }}',
        '{{ (resources.Get "logo.svg" | fingerprint).RelPermalink }}',

        '/sw.js',

        {{- $indexTemplate := resources.Get "index_template.js" -}}
        {{- $index := $indexTemplate | resources.ExecuteAsTemplate "index.js" (dict "context" .) | fingerprint -}}
        '{{- $index.RelPermalink -}}',

        {{- $manifestTemplate := resources.Get "manifest_template.json" -}}
        {{- $manifest := $manifestTemplate | resources.ExecuteAsTemplate "manifest.json" . | fingerprint -}}
        '{{- $manifest.RelPermalink -}}',

        '/offline/',
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('activate_');
  self.clients.claim();
});

// TODO custom 404 page
self.addEventListener('fetch', (event) => {
  var pathname = new URL(event.request.url).pathname;
  event.respondWith(
    // cache then network // TODO update cache (use service worker update?)
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request).then((response) => {
        return caches.open('v6').then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch((error) => {
        return caches.match('/offline/').then(function(response) {
          return response;
        });
      });
    })
  )
});

self.addEventListener('push', function(event) {
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Push Codelab';
  const options = {
    body: 'Yay it works.',
    icon: '{{ (resources.Get "logo.svg" | fingerprint).Permalink }}',
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
