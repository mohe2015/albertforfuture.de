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

        '{{ .Site.BaseURL }}/offline/',
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
  console.log(event.notification)
  const primaryKey = notification.data.primaryKey;

  console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  console.log(event.notification)
  const primaryKey = notification.data.primaryKey;
  const action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll().then(clis => {
        const client = clis.find(c => {
          return c.visibilityState === 'visible';
        });
        if (client !== undefined) {
          client.navigate('/?' + primaryKey);
          client.focus();
        } else {
          // there are no visible windows. Open one.
          clients.openWindow('/?' + primaryKey);
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
    body = event.data.text();
  } else {
    body = 'Default body';
  }
  console.log(body)

  const options = {
    body: body,
    icon: '{{ .Site.BaseURL }}logo.min.svg',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(
    clients.matchAll().then(c => {
      console.log(c);
      //if (c.length === 0) {
        // Show notification
        self.registration.showNotification('Push Notification', options);
      //} else {
        // Send a message to the page to update the UI
      //  console.log('Application is already open!');
      //}
    })
  );
});