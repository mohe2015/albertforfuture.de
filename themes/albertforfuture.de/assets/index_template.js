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
    console.log('User is subscribed.');

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

if ('serviceWorker' in navigator) {
  console.log("service worker supported")
  navigator.serviceWorker.register('{{ .serviceWorker.Permalink }}', {scope: '{{ .context.Site.BaseURL }}'})
  .then((reg) => {
    window.serviceWorkerRegistration = reg;

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

    console.log('Registration succeeded. Scope is ' + reg.scope);
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

window.addEventListener('popstate', (event) => {
  document.getElementById('loader').classList.remove('hide');
  fetch(location.href)
    .then(status)
    .then(text)
    .then(function(html) {
       var parser = new DOMParser();
       var doc = parser.parseFromString(html, 'text/html');

       var body = doc.querySelector('body');

       var documentBody = document.querySelector('body');
       documentBody.parentNode.replaceChild(body, documentBody);

       document.title = doc.querySelector('title').innerText;
       document.getElementById('loader').classList.add('hide');
    }).catch(function(error) {
       document.getElementById('loader').classList.add('hide');
       alert('Request failed ' + error);
    });
});

if (window.fetch && window.history && history.pushState) {
  document.addEventListener("click", function(event) {
    var target = event.target;

    while (target && target.nodeName !== 'A') {
        target = target.parentNode;
    }

    if (target && target.host == window.location.host) {
      event.preventDefault();
      document.getElementById('loader').classList.remove('hide');
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

           history.pushState(null, null, target.href);
           document.getElementById('loader').classList.add('hide');
        }).catch(function(error) {
          document.getElementById('loader').classList.add('hide');
          alert('Request failed ' + error);
        });
     }
  });
}
