self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('{{ .Site.Params.offlineVersion }}').then((cache) => {
      return cache.addAll([
        '{{ (resources.Get "custom.scss" | toCSS | minify).RelPermalink }}',
        '{{ (resources.Get "logo.svg" | minify).RelPermalink }}',
        
        
        '{{ .Site.BaseURL }}/{{ if eq hugo.Environment "production" }}bundle.js{{ else }}index.js{{ end }}',

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
  const primaryKey = notification.data.primaryKey;

  console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
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
          client.navigate('samples/page' + primaryKey + '.html');
          client.focus();
        } else {
          // there are no visible windows. Open one.
          clients.openWindow('samples/page' + primaryKey + '.html');
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

  const options = {
    body: body,
    icon: 'images/notification-flat.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {action: 'explore', title: 'Go to the site',
        icon: 'images/checkmark.png'},
      {action: 'close', title: 'Close the notification',
        icon: 'images/xmark.png'},
    ]
  };
  event.waitUntil(
    clients.matchAll().then(c => {
      console.log(c);
      if (c.length === 0) {
        // Show notification
        self.registration.showNotification('Push Notification', options);
      } else {
        // Send a message to the page to update the UI
        console.log('Application is already open!');
      }
    })
  );
});