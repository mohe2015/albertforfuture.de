import knex from 'knex';
import webpush from 'web-push';
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.PUBLIC_KEY || ! process.env.PRIVATE_KEY) {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log(`echo -e "PUBLIC_KEY=${vapidKeys.publicKey}\\nPRIVATE_KEY=${vapidKeys.privateKey}" >> .env`)
  process.exit(1)
}

webpush.setVapidDetails(
  'mailto:Moritz.Hedtke@t-online.de',
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY
);

export { webpush };

export async function database() {
  let client = knex({
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    },
    useNullAsDefault: false,
    debug: true
  });

  if (!(await client.schema.hasTable('subscriptions'))) {
    await client.schema.createTable('subscriptions', (table) => {
      table.string('subscription')
    })
  }

  return client;
}
