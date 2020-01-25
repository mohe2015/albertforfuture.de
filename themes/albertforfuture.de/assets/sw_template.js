var dict = {
{{ range .Site.Pages }}
  {{ $page := . }}
  {{ if .Paginator }}
    {{ range .Paginator.Pagers }}
      "{{ .URL }}": "{{ .URL }}rawhtml.html?{{ sha256 $page.Plain }}",
    {{ end }}
  {{ else }}
    "{{ .RelPermalink }}": "{{ ((.OutputFormats.Get "RawHTML").RelPermalink) }}?{{ sha256 .Plain }}",
  {{ end }}
{{ end }}
}

self.addEventListener('install', (event) => {
  console.log('install');
  self.skipWaiting();
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '{{ (resources.Get "main.css" | toCSS | minify | fingerprint).RelPermalink }}',
        '{{ (resources.Get "logo.svg" | fingerprint).RelPermalink }}',

        '/sw.js',

        {{- $indexTemplate := resources.Get "index_template.js" -}}
        {{- $index := $indexTemplate | resources.ExecuteAsTemplate "index.js" (dict "context" .) | fingerprint -}}
        '{{- $index.RelPermalink -}}',

        {{- $manifestTemplate := resources.Get "manifest_template.json" -}}
        {{- $manifest := $manifestTemplate | resources.ExecuteAsTemplate "manifest.json" . | fingerprint -}}
        '{{- $manifest.RelPermalink -}}',

        '/shell/?v={{ sha256 (.Site.GetPage "/shell").Plain }}',
        '{{ with (.Site.GetPage "/offline") }}{{ ((.OutputFormats.Get "RawHTML").RelPermalink) }}?{{ sha256 .Plain }}{{ end }}'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('activate_');
  self.clients.claim();
});

function renderTemplate (template, data) {
  return template
    .replace(/<body[^>]*>((.|[\n\r])*)<\/body>/im, data)
    .replace("(title)", /<h1.*?>(.*)<\/h1>/.exec(data)[1]);
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
          return resp || fetch(dict[pathname]).then((response) => {
            return caches.open('v1').then((cache) => {
              cache.put(dict[pathname], response.clone());
              return response;
            });
          }).catch((error) => {
            return caches.match('{{ with (.Site.GetPage "/offline") }}{{ ((.OutputFormats.Get "RawHTML").RelPermalink) }}?{{ sha256 .Plain }}{{ end }}').then(function(response) {
              return response;
            });
          });
        }).then(e => e.text())
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
