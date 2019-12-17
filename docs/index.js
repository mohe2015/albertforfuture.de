if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', {scope: '/'})
  .then((reg) => {
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch((error) => {
    console.log('Registration failed with ' + error);
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.prompt();
  });
}
