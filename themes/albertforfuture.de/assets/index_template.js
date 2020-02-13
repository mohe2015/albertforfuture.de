const applicationServerPublicKey = 'BACf2AL3ElM5rFuFoXZz7j6-lpaI5h2L5BvZWMPzQxDCKNEw5GYlu7Luf3xRyD33QgkkyBYSLy5xKM7H_pzdCCI=';

// https://developers.google.com/web/fundamentals/codelabs/push-notifications

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  window.serviceWorkerRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log(JSON.stringify(subscription));

    //updateSubscriptionOnServer(subscription);

    isSubscribed = true;

    //updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    //updateBtn();
  });
}

function downloadAllArticles() {
  if (localStorage.getItem('offline') === 'v6') {
    console.log("articles already downloaded");
    return;
  }
  setTimeout(function() {
    window.caches.open('v6').then(function(cache) {
      cache.addAll([
        {{- range .context.Site.Pages -}}
          {{ $page := . }}
          {{ if .Paginator }}
            {{ range .Paginator.Pagers }}
              "{{- .URL -}}",
            {{ end }}
          {{ else }}
            "{{- .RelPermalink -}}",
          {{ end }}
        {{ end }}
      ]);
    }).then(event => {
      localStorage.setItem('offline', 'v6');
      document.getElementById('toast-offline').classList.remove('d-none');
      new bootstrap.Toast(document.getElementById('toast-offline'), {delay: 5000}).show();
      document.getElementById('toast-offline').addEventListener('hidden.bs.toast', function () {
        document.getElementById('toast-offline').remove();
      })
    }).catch(error => {
      console.log("Fehler beim Offline gehen!");
    });
  }, 10000);
}

if ('serviceWorker' in navigator) {
  console.log("service worker supported")
  navigator.serviceWorker.register('/sw.js', {scope: '{{ .context.Site.BaseURL }}'})
  .then((registration) => {
    window.serviceWorkerRegistration = registration;

    console.log(registration);

    if (registration.active && registration.active.state === 'activated') {
      console.log(registration.active);
      downloadAllArticles();
    }

    if (registration.installing) {
      registration.installing.addEventListener('statechange', function() {
        console.log('[controllerchange][statechange] ' +
          'A "statechange" has occured: ', this.state
        );
        if (this.state === 'activated') {
          downloadAllArticles();
        }
      });
    }

    window.serviceWorkerRegistration.pushManager.getSubscription()
    .then(function (subscription) {

      isSubscribed = !(subscription === null);

      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }
      console.log(subscription);
    });

    //subscribeUser();

    // TODO show notification bell

    console.log('Registration succeeded. Scope is ' + registration.scope);
  }).catch((error) => {
    console.log('Registration failed with ' + error);
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    //e.prompt(); store e somewhere, use on user interaction
  });

  if ('PushManager' in window) {
    console.log("push supported")
  }
}

function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function text(response) {
  return response.text()
}

/*
if (true && window.fetch && window.history && history.pushState) {
  window.addEventListener('scroll', function(e) {
    console.log("scroll", window.scrollY)
    history.replaceState({scrollY: window.scrollY}, null, null)
  });
  
  window.addEventListener('popstate', (event) => {
    document.getElementById('loader').classList.add('show');
    fetch(location.href)
      .then(status)
      .then(text)
      .then(function(html) {
         var parser = new DOMParser();
         var doc = parser.parseFromString(html, 'text/html');

         var body = doc.querySelector('body');

         var documentBody = document.querySelector('body');
         documentBody.parentNode.replaceChild(body, documentBody);
         
         console.log("window.scrollTo", event.state.scrollY)
         window.scrollTo(0, event.state.scrollY);

         document.title = doc.querySelector('title').innerText;

         document.getElementById('loader').classList.remove('show');
      }).catch(function(error) {
         document.getElementById('loader').classList.remove('show');
         alert('Request failed ' + error);
      });
  });

  document.addEventListener("click", function(event) {
    var target = event.target;

    while (target && target.nodeName !== 'A') {
        target = target.parentNode;
    }

    if (target && target.host == window.location.host) {
      event.preventDefault();
      document.getElementById('loader').classList.add('show');
      fetch(target.href)
        .then(status)
        .then(text)
        .then(function(html) {
           var parser = new DOMParser();
           var doc = parser.parseFromString(html, 'text/html');

           var body = doc.querySelector('body');

           var documentBody = document.querySelector('body');
           documentBody.parentNode.replaceChild(body, documentBody);

           document.title = doc.querySelector('title').innerText;

           history.pushState({scrollY: 0}, null, target.href);
           console.log("pushState", 0)
           window.scrollTo(0, 0);

           // TODO FIXME redirect sites contain no content!!!!
           document.getElementById('loader').classList.remove('show');
        }).catch(function(error) {
          document.getElementById('loader').classList.remove('show');
          alert('Request failed ' + error);
        });
     }
  });
}
*/