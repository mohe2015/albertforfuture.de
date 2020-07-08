import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
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
  sqlite3.verbose()
  const db = await open({
    filename: "./mydb.sqlite",
    driver: sqlite3.Database,
  })

  await db.exec('CREATE TABLE IF NOT EXISTS subscriptions (subscription TEXT)') 

  return db;
}
