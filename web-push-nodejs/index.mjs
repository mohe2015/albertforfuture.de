import webpush from 'web-push';
import http from 'http';

// VAPID keys should only be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys)

//webpush.setGCMAPIKey(null);
webpush.setVapidDetails(
  'mailto:Moritz.Hedtke@t-online.de',
  // these seem to be right as it shows an error otherwise
  'BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI',
  '0mLNzXPZByhr4sHaETjHvhIReXOrczKzv8cCLCUZi_Q'
  //vapidKeys.publicKey,
  //vapidKeys.privateKey
);

const server = http.createServer((req, res) => {
  let data = []
  req.on('data', chunk => {
    data.push(chunk)
  })
  req.on('end', async () => {
    let pushSubscription = JSON.parse(data)
    console.log(pushSubscription)
    try {
      await webpush.sendNotification(pushSubscription, '');
    } catch (error) {
      console.log(error)
    }
    res.writeHead(200);
    res.end('Hello, World!');
  })
  console.log('hi')
})
server.listen(3030)

// TODO FIXME did the service worker cache a successful post?