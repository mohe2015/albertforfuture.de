#[macro_use]
extern crate diesel;
extern crate dotenv;

pub mod models;
pub mod schema;

use diesel::prelude::*;
use dotenv::dotenv;
use std::env;
use self::models::*;

use std::{fs::File};
use web_push::*;

use warp::http::StatusCode;

use self::schema::subscribers;

/*

openssl ec -in private_key.pem -text
echo "d2:62:cd:cd:73:d9:07:28:6b:e2:c1:da:11:38:c7:
      be:12:11:79:73:ab:73:32:b3:bf:c7:02:2c:25:19:
      8b:f4" | tr -d '\n: ' | xxd -r -p | base64 | tr '/+' '_-'|tr -d '\n='

*/

// https://github.com/diesel-rs/diesel/tree/master/examples/sqlite/getting_started_step_3
pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

pub async fn subscribe(subscriber: SubscriptionInfo) -> Result<impl warp::Reply, warp::Rejection> {
    println!("{} {} {}", subscriber.endpoint, subscriber.keys.p256dh, subscriber.keys.auth);
    
    let connection = establish_connection();

    let new_subscriber = NewSubscriber {
        endpoint: &subscriber.endpoint,
        key_p256dh: &subscriber.keys.p256dh,
        key_auth: &subscriber.keys.auth
    };

    diesel::insert_or_ignore_into(subscribers::table)
        .values(&new_subscriber)
        .execute(&connection)
        .expect("Error saving new subscriber");

    let _result = subscribers::table
        .filter(subscribers::endpoint.eq(&subscriber.endpoint))
        .first::<Subscriber>(&connection)
        .expect("Error loading subscribers");

    let result = send_notification(&subscriber, r#"{"text":"Push-Benachrichtigungen aktiviert!", "url": "/"}"#).await;

    println!("{:?}", result);

    
    Ok(StatusCode::OK)
}


pub async fn unsubscribe(subscriber: SubscriptionInfo) -> Result<impl warp::Reply, warp::Rejection> {
    println!("{} {} {}", subscriber.endpoint, subscriber.keys.p256dh, subscriber.keys.auth);
    
    let connection = establish_connection();

    diesel::delete(subscribers::table.filter(subscribers::endpoint.eq(subscriber.endpoint))).execute(&connection).unwrap();

    Ok(StatusCode::OK)
}

pub async fn send_notification(subscription: &SubscriptionInfo, payload: &str) -> std::result::Result<(), web_push::WebPushError> {
    let mut builder = WebPushMessageBuilder::new(&subscription).unwrap();
    builder.set_ttl(60);
    builder.set_payload(ContentEncoding::AesGcm, payload.as_bytes());
    let file = File::open("./private_key.pem").unwrap();
    let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription).unwrap();
    sig_builder.add_claim("sub", "mailto:Moritz.Hedtke@t-online.de");
    let signature = sig_builder.build().unwrap();
    println!("{:?}", signature);
    builder.set_vapid_signature(signature);
    let client = WebPushClient::new();
    let built = builder.build().unwrap();
    let response = client.send(built).await;
    return response
}
