self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('{{ .Site.Params.offlineVersion }}').then((cache) => {
      return cache.addAll([
        '{{ (resources.Get "custom.scss" | toCSS | minify).RelPermalink }}',
        '{{ (resources.Get "logo.svg" | minify).RelPermalink }}',
        
        {{ $bootstrap := resources.Get "bootstrap/dist/js/bootstrap.js" }}
        {{ $indexTemplate := resources.Get "index_template.js" }}
        {{ $index := $indexTemplate | resources.ExecuteAsTemplate "index.js" (dict "context" .) }}
        {{ $js := slice $bootstrap $index | resources.Concat "bundle.js" | minify }}
        '{{ $js.RelPermalink }}',

        '{{ .Site.BaseURL }}sw.min.js',

        {{- $manifestTemplate := resources.Get "manifest_template.json" -}}
        {{- $manifest := $manifestTemplate | resources.ExecuteAsTemplate "manifest.json" . | minify -}}
        '{{- $manifest.RelPermalink -}}',

        '/offline/',
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('activate_');
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== '{{ .Site.Params.offlineVersion }}';
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// TODO custom 404 page
self.addEventListener('fetch', (event) => {
  var pathname = new URL(event.request.url).pathname;
  event.respondWith(
    caches.match(event.request).then(cacheResponse => {
      return cacheResponse || fetch(event.request).then(response => {
        return caches.open('{{ .Site.Params.offlineVersion }}').then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(error => {
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
    icon: '{{ (resources.Get "logo.svg" | minify).Permalink }}',
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
