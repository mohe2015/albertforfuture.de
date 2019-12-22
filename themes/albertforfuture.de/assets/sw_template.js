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
        '{{ .Site.BaseURL }}shell/?v={{ sha256 (.Site.GetPage "/shell").Plain }}'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('activate');
  self.clients.claim();
});

function renderTemplate (template, data) {
  // TODO fixme title
  return template.replace("{shell}", data);
}

// TODO custom 404 page
self.addEventListener('fetch', (event) => {
  var pathname = new URL(event.request.url).pathname;
  if (dict[pathname]) {
    event.respondWith(
      // cache then network
      Promise.all([
        caches.match('{{ .Site.BaseURL }}shell/?v={{ sha256 (.Site.GetPage "/shell").Plain }}').then(function(response) {
          return response.text();
        }),
        caches.match(dict[pathname]).then((resp) => {
          return (resp || fetch(dict[pathname]).then((response) => {
            return caches.open('v1').then((cache) => {
              cache.put(dict[pathname], response.clone());
              return response;
            });
          })).text();
        })
      ]).then(function(responses) {
        var template = responses[0];
        var data = responses[1];

        return new Response(renderTemplate(template, data), {
          headers: {
            'Content-Type': 'text/html'
          }
        });
      })
    );
  } else {
    event.respondWith(
      // cache then network
      caches.match(event.request).then((resp) => {
        return resp || fetch(event.request).then((response) => {
          return caches.open('v1').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
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
