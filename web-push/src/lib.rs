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

    let result = send_notification(&subscriber, "Push-Benachrichtigungen aktiviert!").await;

    println!("{:?}", result);

    //return match result {
    //    Ok(_) => Ok(StatusCode::OK),
    //    Err(EndpointNotValid)
    //    Err(_) => Ok(StatusCode::NotFound),
    //}
    Ok(StatusCode::OK)
}


pub async fn unsubscribe(subscriber: SubscriptionInfo) -> Result<impl warp::Reply, warp::Rejection> {
    println!("{} {} {}", subscriber.endpoint, subscriber.keys.p256dh, subscriber.keys.auth);
    
    let connection = establish_connection();

    diesel::delete(subscribers::table.filter(subscribers::endpoint.eq(subscriber.endpoint))).execute(&connection).unwrap();

    Ok(StatusCode::OK)
}

// BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI=

pub async fn send_notification(subscription: &SubscriptionInfo, payload: &str) -> std::result::Result<(), web_push::WebPushError> {
    let mut builder = WebPushMessageBuilder::new(&subscription).unwrap();
    builder.set_ttl(5184000);
    builder.set_payload(ContentEncoding::AesGcm, payload.as_bytes());
    builder.set_gcm_key("BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI=");
    let file = File::open("./private_key.pem").unwrap();
    let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription).unwrap();
    sig_builder.add_claim("sub", "mailto:test@example.com");
    let signature = sig_builder.build().unwrap();
    builder.set_vapid_signature(signature);
    let client = WebPushClient::new();
    let built = builder.build().unwrap();
    let response = client.send(built).await;
    return response
}
