self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('{{ .Site.Params.offlineVersion }}').then((cache) => {
      return cache.addAll([
        '{{ (resources.Get "custom.scss" | toCSS | minify).RelPermalink }}',
        '{{ (resources.Get "logo.svg" | minify).RelPermalink }}',
        
        
        '{{ .Site.BaseURL }}bundle.js',

        '{{ .Site.BaseURL }}sw.min.js',

        {{- $manifestTemplate := resources.Get "manifest_template.json" -}}
        {{- $manifest := $manifestTemplate | resources.ExecuteAsTemplate "manifest.json" . | minify -}}
        '{{- $manifest.RelPermalink -}}',

        '{{ .Site.BaseURL }}offline/',
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

// https://codelabs.developers.google.com/codelabs/pwa-integrating-push/index.html?index=..%2F..dev-pwa-training#0

self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  console.log('notificationclose', event.notification)
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  console.log('notificationclick', event.notification)
  const data = notification.data;
  const action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll().then(clis => {
        console.log('clients', clis)
        const client = clis.find(c => {
          return c.visibilityState === 'visible';
        });
        if (client !== undefined) {
          client.navigate(data.url);
          client.focus();
        } else {
          // there are no visible windows. Open one.
          clients.openWindow(data.url);
          notification.close();
        }
      })
    );
  }

  self.registration.getNotifications().then(notifications => {
    notifications.forEach(notification => {
      notification.close();
    });
  });
});

self.addEventListener('push', event => {
  let body;

  if (event.data) {
    body = event.data.json();
  } else {
    body = {
      text: 'albertforfuture.de wurde aktualisiert!',
      url: '/'
    }
  }
  console.log('push', body)

  const options = {
    body: body.text,
    icon: '{{ .Site.BaseURL }}logo.min.svg',
    lang: 'de-DE',
    // badge, actions
    data: body
  };
  event.waitUntil(
    clients.matchAll().then(c => {
      console.log(c);
      //if (c.length === 0) {
        // Show notification
        self.registration.showNotification('albertforfuture.de', options);
      //} else {
        // Send a message to the page to update the UI
      //  console.log('Application is already open!');
      //}
    })
  );
});