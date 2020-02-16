// https://developers.google.com/web/fundamentals/codelabs/push-notifications
// https://codelabs.developers.google.com/codelabs/pwa-integrating-push/index.html?index=..%2F..dev-pwa-training#0

'use strict';

let isSubscribed = false;
let swRegistration = null;

const notifyButton = document.querySelector('.js-notify-btn');
const pushButton = document.querySelector('.js-push-btn');
const applicationServerPublicKey = 'BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI=';

if (!('Notification' in window)) {
  console.log('Notifications not supported in this browser');
  return;
}

Notification.requestPermission(status => {
  console.log('Notification permission status:', status);
});

function displayNotification() {
  if (Notification.permission == 'granted') {
    navigator.serviceWorker.getRegistration().then(reg => {
      const options = {
        body: 'First notification!',
        tag: 'id1',
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
      reg.showNotification('Hello world!', options);
    });
  }
}

function initializeUI() {
  pushButton.addEventListener('click', () => {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });

  // Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(subscription => {
    isSubscribed = (subscription !== null);

    updateSubscriptionOnServer(subscription);

    if (isSubscribed) {
      console.log('User IS subscribed.');
    } else {
      console.log('User is NOT subscribed.');
    }

    updateBtn();
  });
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(subscription => {
    console.log('User is subscribed:', subscription);

    updateSubscriptionOnServer(subscription);

    isSubscribed = true;

    updateBtn();
  })
  .catch(err => {
    if (Notification.permission === 'denied') {
      console.warn('Permission for notifications was denied');
    } else {
      console.error('Failed to subscribe the user: ', err);
    }
    updateBtn();
  });
}

function unsubscribeUser() {
  swRegistration.pushManager.getSubscription()
  .then(subscription => {
    if (subscription) {
      return subscription.unsubscribe();
    }
  })
  .catch(err => {
    console.log('Error unsubscribing', err);
  })
  .then(() => {
    updateSubscriptionOnServer(null);

    console.log('User is unsubscribed');
    isSubscribed = false;

    updateBtn();
  });
}

function updateSubscriptionOnServer(subscription) {
  // Here's where you would send the subscription to the application server

  const subscriptionJson = document.querySelector('.js-subscription-json');
  const endpointURL = document.querySelector('.js-endpoint-url');
  const subAndEndpoint = document.querySelector('.js-sub-endpoint');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    endpointURL.textContent = subscription.endpoint;
    subAndEndpoint.style.display = 'block';
  } else {
    subAndEndpoint.style.display = 'none';
  }
}

function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}

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

notifyButton.addEventListener('click', () => {
  displayNotification();
});








if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('{{ .context.Site.BaseURL }}sw.min.js', {scope: '{{ .context.Site.BaseURL }}'})
    .then(swReg => {
      console.log('Service Worker is registered', swReg);

      swRegistration = swReg;

      initializeUI();

      if (swRegistration.active && swRegistration.active.state === 'activated') {
        console.log(swRegistration.active);
        downloadAllArticles();
      }
      if (swRegistration.installing) {
        swRegistration.installing.addEventListener('statechange', function() {
          console.log('[controllerchange][statechange] ' +
            'A "statechange" has occured: ', this.state
          );
          if (this.state === 'activated') {
            downloadAllArticles();
          }
        });
      }
    })
    .catch(err => {
      console.error('Service Worker Error', err);
    });
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = 'Push Not Supported';
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

function downloadAllArticles() {
  if (localStorage.getItem('offline') === '{{ .context.Site.Params.offlineVersion }}') {
    console.log("articles already downloaded");
    return;
  }
  setTimeout(function() {
    window.caches.open('{{ .context.Site.Params.offlineVersion }}').then(function(cache) {
      cache.addAll([
        /* this is really buggy - if this is executed before index.html template it will override the paginator as it is lazily generated */
        {{- range .context.Site.Pages -}}
          {{ if .IsHome }}
          /* this is a REALLY UGLY HACK */
          {{ $paginator := .Paginate (where .Pages "Type" "article") }}
          {{ end }}
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
      localStorage.setItem('offline', '{{ .context.Site.Params.offlineVersion }}');
      document.getElementById('toast-offline').classList.remove('d-none');
      new bootstrap.Toast(document.getElementById('toast-offline'), {delay: 5000}).show();
      document.getElementById('toast-offline').addEventListener('hidden.bs.toast', function () {
        document.getElementById('toast-offline').remove();
      })
    }).catch(error => {
      console.log("Fehler beim Offline gehen!", error);
    });
  }, 10000);
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