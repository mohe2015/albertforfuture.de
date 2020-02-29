import { database, webpush } from './lib.mjs'

async function main() {
  if (!(process.argv.length === 3)) {
    console.log('missing message argument')
    return;
  }
  let message = process.argv[2]
  let jsonMessage = JSON.parse(message)
  if (!jsonMessage.hasOwnProperty('text')) {
    console.log('missing text json key')
    return;
  }
  if (!jsonMessage.hasOwnProperty('url')) {
    console.log('missing text url key')
    return;
  }
  if (jsonMessage.url.includes('.md')) {
    console.log('url contains .md')
    return;
  }
  if (!jsonMessage.url.endsWith('/')) {
    console.log('url doesn\'t end in /')
    return;
  }

  let client = await database()

  let subscriptions = await client('subscriptions').select('subscription')
  for (let subscriptionRow of subscriptions) {
    let subscription = subscriptionRow['subscription']
    let pushSubscription = JSON.parse(subscription)
    
    console.log(pushSubscription.endpoint)

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(message))
    } catch (error) {
      console.log(error)

      if (error.body === 'push subscription has unsubscribed or expired.\n') {
        console.log('unsubscribed, delete')
        await client('subscriptions').del({
          subscription: subscription
        })
      }
    }
  }
  await client.destroy()
}

main()