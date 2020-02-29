import knex from 'knex';
import webpush from 'web-push';

// VAPID keys should only be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();
//console.log(vapidKeys)

webpush.setVapidDetails(
  'mailto:Moritz.Hedtke@t-online.de',
  'BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI',
  '0mLNzXPZByhr4sHaETjHvhIReXOrczKzv8cCLCUZi_Q' // TODO FIXME REMOVE THIS
  //vapidKeys.publicKey,
  //vapidKeys.privateKey
);

export { webpush };

export async function database() {
  let client = knex({
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    },
    useNullAsDefault: false,
    debug: false
  });

  if (!(await client.schema.hasTable('subscriptions'))) {
    await client.schema.createTable('subscriptions', (table) => {
      table.string('subscription')
    })
  }

  return client;
}