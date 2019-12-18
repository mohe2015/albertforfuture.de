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
  navigator.serviceWorker.register('./sw.js', {scope: '/'})
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

    subscribeUser();

    // TODO show notification bell

    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch((error) => {
    console.log('Registration failed with ' + error);
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.prompt();
  });

  if ('PushManager' in window) {
    console.log("push supported")
  }
}
