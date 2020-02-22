import 'bootstrap/js/src/collapse';
import 'bootstrap/js/src/toast'

// https://developers.google.com/web/fundamentals/codelabs/push-notifications
// https://codelabs.developers.google.com/codelabs/pwa-integrating-push/index.html?index=..%2F..dev-pwa-training#0

'use strict';

let isSubscribed = false;
let swRegistration = null;

const pushButton = document.querySelector('.js-push-btn');
const applicationServerPublicKey = 'BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI=';

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

    if (isSubscribed) {
      // TODO this isn't really needed as long as subscribing is reliable
      // although if the database fails this may recover it if the user opens the site again
      // on the other hand it would save some data if this isn't done for every request.
      updateSubscriptionOnServer(subscription);
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

    // TODO local storage should store whether this was successful as otherwise the user sees himself as subscribed
    // but he actually isn't
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
    // TODO this is most likely useless as the server will probably get an error response from the push server if the user unsubscribed
    //updateSubscriptionOnServer(null);
    // also it doesnt know whom to unsubscribe

    console.log('User is unsubscribed');
    isSubscribed = false;

    updateBtn();
  });
}

function updateSubscriptionOnServer(subscription) {
  // Here's where you would send the subscription to the application server

  if (subscription) {
    fetch("/api/v1/add_push", {
      method: 'POST',
      mode: "same-origin",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    }).then(response => {
      console.log("Updated!");
    }).catch(error => {
      if (subscription) {
        alert("Fehler beim Aktivieren der Push-Benachrichtigungen: " + error);
      }
    })
  } else {
    fetch("/api/v1/remove_push", {
      method: 'POST',
      mode: "same-origin",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    }).then(response => {
      console.log("Updated!");
    }).catch(error => {
      if (subscription) {
        alert("Fehler beim Aktivieren der Push-Benachrichtigungen: " + error);
      }
    })
  }

  
}

function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked';
    pushButton.disabled = true;
    // TODO this is most likely useless as the server will probably get an error response from the push server if the user unsubscribed
    // also it doesnt know whom to unsubscribe
    // updateSubscriptionOnServer(null);
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








if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('{{ .context.Site.BaseURL }}sw.min.js', {scope: '{{ .context.Site.BaseURL }}'})
    .then(swReg => {
      console.log('Service Worker is registered', swReg);

      swRegistration = swReg;

      if ('Notification' in window) {
        initializeUI();
      } else {
        console.warn('Push messaging is not supported');
        pushButton.textContent = 'Push Not Supported';
      }

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
  console.warn('Service worker is not supported');
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
        /* TODO FIXME ADD BACK REMOVED CODE!!! */
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