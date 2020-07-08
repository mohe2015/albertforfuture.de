import http from 'http'
import { database, webpush } from './lib.mjs'

async function main() {
  let db = await database()
  const stmt = await db.prepare('INSERT INTO subscriptions (subscription) VALUES ?')

  const server = http.createServer((request, response) => {
    request.on('error', error => {
      console.error(error);
      response.statusCode = 400;
      response.end();
    })
    response.on('error', error => {
      console.error(error);
    });
    let data = []
    request.on('data', chunk => {
      data.push(chunk)
    })
    request.on('end', async () => {
      let body = Buffer.concat(data).toString();
      let pushSubscription = JSON.parse(body)
      console.log(pushSubscription)
      try {
        let reply = {
            text: 'Push-Benachrichtigungen aktiviert!',
            url: '/'
        }
        await webpush.sendNotification(pushSubscription, JSON.stringify(reply));
        
        await stmt.bind({ 1: body })
        await stmt.run()

        response.writeHead(200);
        response.end();
      } catch (error) {
        console.log(error)
        response.writeHead(500);
        response.end(error.toString());
      }
    })
  })
  server.listen(3030)
  // await client.destroy()
}

main()
