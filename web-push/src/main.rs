#[macro_use]
extern crate diesel;
extern crate dotenv;

pub mod models;
pub mod schema;

use diesel::prelude::*;
use dotenv::dotenv;
use std::env;
use self::models::*;

use argparse::{ArgumentParser, Store, StoreOption};
use std::{fs::File, io::Read};
use web_push::*;

use warp::Filter;
use std::convert::Infallible;
use warp::http::StatusCode;

use schema::subscribers;

// https://github.com/diesel-rs/diesel/tree/master/examples/sqlite/getting_started_step_3
pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

use serde_derive::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SubscriberKeysJson {
    pub p256dh: String,
    pub auth: String
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SubscriberJson {
    pub endpoint: String,
    pub keys: SubscriberKeysJson
}

// TODO FIXME implement unsubscribe
pub async fn subscribe(subscriber: SubscriberJson) -> Result<impl warp::Reply, Infallible> {
    println!("{} {} {}", subscriber.endpoint, subscriber.keys.p256dh, subscriber.keys.auth);
    
    let connection = establish_connection();

    // FIXME TODO remove duplicates
    let new_subscriber = NewSubscriber {
        endpoint: &subscriber.endpoint,
        key_p256dh: &subscriber.keys.p256dh,
        key_auth: &subscriber.keys.auth
    };

    diesel::insert_into(subscribers::table)
        .values(&new_subscriber)
        .execute(&connection)
        .expect("Error saving new subscriber");

    Ok(StatusCode::CREATED)
}

#[tokio::main]
async fn main() {
    
    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["Content-Type"])
        .allow_methods(vec!["POST", "OPTIONS"]);

    let hello = warp::path!("api" / "v1" / "push")
        .and(warp::post())
        .and(warp::body::content_length_limit(1024 * 16))
        .and(warp::body::json())
        .and_then(subscribe)
        .with(cors);

    warp::serve(hello)
        .tls()
        .cert_path("../../localhost.pem")
        .key_path("../../localhost-key.pem")
        .run(([127, 0, 0, 1], 3030))
        .await;
}

fn main1() {

    let connection = establish_connection();

    let results = subscribers::table
        .limit(5)
        .load::<Subscriber>(&connection)
        .expect("Error loading subscribers");

    println!("Displaying {} subscribers", results.len());
    for subscribers in results {
        println!("{}", subscribers.endpoint);
    }
}

// BAvD4b287z3xfU293G2JSKXybiHv-19mNhzlvQmmDk9drnsWhPpeSC6d9uCThC4y4abw4gjyxA8YX9Z7rk4PfvI=

#[tokio::main]
async fn main2() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    let mut subscription_info_file = String::new();
    let mut gcm_api_key: Option<String> = None;
    let mut vapid_private_key: Option<String> = None;
    let mut push_payload: Option<String> = None;
    let mut ttl: Option<u32> = None;

    {
        let mut ap = ArgumentParser::new();
        ap.set_description("A web push sender");

        ap.refer(&mut gcm_api_key).add_option(
            &["-k", "--gcm_api_key"],
            StoreOption,
            "Google GCM API Key",
        );

        ap.refer(&mut vapid_private_key).add_option(
            &["-v", "--vapid_key"],
            StoreOption,
            "A NIST P256 EC private key to create a VAPID signature",
        );

        ap.refer(&mut subscription_info_file)
            .add_option(&["-f", "--subscription_info_file"], Store,
                        "Subscription info JSON file, https://developers.google.com/web/updates/2016/03/web-push-encryption");

        ap.refer(&mut push_payload).add_option(
            &["-p", "--push_payload"],
            StoreOption,
            "Push notification content",
        );

        ap.refer(&mut ttl).add_option(
            &["-t", "--time_to_live"],
            StoreOption,
            "TTL of the notification",
        );

        ap.parse_args_or_exit();
    }

    let mut file = File::open(subscription_info_file).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();

    let subscription_info: SubscriptionInfo = serde_json::from_str(&contents).unwrap();

    let mut builder = WebPushMessageBuilder::new(&subscription_info).unwrap();

    if let Some(ref payload) = push_payload {
        builder.set_payload(ContentEncoding::AesGcm, payload.as_bytes());
    }

    if let Some(ref gcm_key) = gcm_api_key {
        builder.set_gcm_key(gcm_key);
    }

    if let Some(time) = ttl {
        builder.set_ttl(time);
    }

    if let Some(ref vapid_file) = vapid_private_key {
        let file = File::open(vapid_file).unwrap();

        let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription_info).unwrap();

        sig_builder.add_claim("sub", "mailto:test@example.com");
        sig_builder.add_claim("foo", "bar");
        sig_builder.add_claim("omg", 123);

        let signature = sig_builder.build().unwrap();

        builder.set_vapid_signature(signature);
    };

    let client = WebPushClient::new();

    let response = client.send(builder.build()?).await?;
    println!("Sent: {:?}", response);

    Ok(())
}
