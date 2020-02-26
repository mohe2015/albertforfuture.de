async function install() {
  let cache = await caches.open('{{ .Site.Params.offlineVersion }}')
  return await cache.addAll([
    '{{ (resources.Get "custom.scss" | toCSS | minify).RelPermalink }}',
    '{{ (resources.Get "logo.svg" | minify).RelPermalink }}',
    '{{ .Site.BaseURL }}bundle.js',
    '{{ .Site.BaseURL }}sw.min.js',
    {{- $manifestTemplate := resources.Get "manifest_template.json" -}}
    {{- $manifest := $manifestTemplate | resources.ExecuteAsTemplate "manifest.json" . | minify -}}
    '{{- $manifest.RelPermalink -}}',
    '{{ .Site.BaseURL }}offline/'
  ])
}

self.addEventListener('install', async (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(install());
});

async function activate() {
  let cacheNames = await caches.keys()
    
  await Promise.all(cacheNames.filter(cacheName => {
    return cacheName !== '{{ .Site.Params.offlineVersion }}'
  }).map(async cacheName => {
    return await caches.delete(cacheName);
  }))
}

self.addEventListener('activate', event => {
  console.log('activate_');
  self.clients.claim();
  event.waitUntil(activate());
});

async function fetchOnline(event) {
  let response = await fetch(event.request)  
  let cache = await caches.open('{{ .Site.Params.offlineVersion }}')
  await cache.put(event.request, response.clone())
  return response
}

async function onfetch(event) {
  var pathname = new URL(event.request.url).pathname;
  try {
    return await caches.match(event.request) || await fetchOnline(event)
  } catch (error) {
    console.log(error)
    return await caches.match('/offline/')
  }
}

// TODO custom 404 page
self.addEventListener('fetch', event => {
  event.respondWith(onfetch(event))
});

// https://codelabs.developers.google.com/codelabs/pwa-integrating-push/index.html?index=..%2F..dev-pwa-training#0

self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  console.log('notificationclose', event.notification)
});

async function notificationclick(event) {
  let clis = await clients.matchAll()
      
  console.log('clients', clis)
  const client = clis.find(c => {
    return c.visibilityState === 'visible';
  });
  if (client !== undefined) {
    client.navigate(event.notification.data.url);
    client.focus();
  } else {
    // there are no visible windows. Open one.
    clients.openWindow(event.notification.data.url);
    event.notification.close();
  }
}

self.addEventListener('notificationclick', async event => {
  const notification = event.notification;
  console.log('notificationclick', event.notification)
  const action = event.action;

  if (action === 'close') {
    notification.close();
  } else {
    event.waitUntil(notificationclick(event));
  }

  let notifications = await self.registration.getNotifications()
  notifications.forEach(notification => {
    notification.close();
  });
});

async function push(event, options) {
  try {
    let response = await fetch(options.data.url)
    console.log('push prefetched data: ', response)
  } catch (error) {
    console.log('we couldnt prefetch the article but still have to show a notification :(')
  }
  //let c = await clients.matchAll()
  //console.log(c);
  //if (c.length === 0) {
    // Show notification
  await self.registration.showNotification('albertforfuture.de', options);
  //} else {
    // Send a message to the page to update the UI
  //  console.log('Application is already open!');
  //}
}

self.addEventListener('push', async event => {
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
  event.waitUntil(push(event, options));
});