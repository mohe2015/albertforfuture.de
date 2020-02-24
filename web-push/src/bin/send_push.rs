extern crate diesel;
extern crate dotenv;

use diesel::prelude::*;
use push::models::*;

use web_push::*;

use push::schema::subscribers;
use push::establish_connection;
use push::send_notification;

#[tokio::main]
async fn main() {
  let connection = establish_connection();

  let results = subscribers::table
      .load::<Subscriber>(&connection)
      .expect("Error loading subscribers");

  println!("Displaying {} subscribers", results.len());
  for subscriber in results {
    let a = SubscriptionInfo {
      endpoint: subscriber.endpoint,
      keys: SubscriptionKeys {
        p256dh: subscriber.key_p256dh,
        auth: subscriber.key_auth
      }
    };

    let result = send_notification(&a, "Ein neuer Artikel ist online!").await;

    //return match result {
    //    Ok(_) => Ok(StatusCode::OK),
    //    Err(EndpointNotValid)
    //    Err(_) => Ok(StatusCode::NotFound),
    //}

    println!("{:?}", result);

    if let Err(web_push::WebPushError::EndpointNotValid) = result {
      println!("Invalid endpoint, deleting!");

      diesel::delete(subscribers::table.filter(subscribers::endpoint.eq(&a.endpoint))).execute(&connection).unwrap();
    }
  }
}