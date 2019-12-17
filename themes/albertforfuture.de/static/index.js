if ('serviceWorker' in navigator) {
  console.log("service worker supported")
  navigator.serviceWorker.register('./sw.js', {scope: '/'})
  .then((reg) => {
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
