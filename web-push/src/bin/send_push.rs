#[macro_use]
extern crate diesel;
extern crate dotenv;

use diesel::prelude::*;
use dotenv::dotenv;
use std::env;
use push::models::*;

use std::{fs::File};
use web_push::*;

use warp::Filter;
use warp::http::StatusCode;

use push::schema::subscribers;

use push::establish_connection;
use push::send_notification;

#[tokio::main]
async fn main() {
  let connection = establish_connection();

  let results = subscribers::table
      .limit(5)
      .load::<Subscriber>(&connection)
      .expect("Error loading subscribers");

  println!("Displaying {} subscribers", results.len());
  for subscriber in results {
    let _test = send_notification(&subscriber).await;
  }
}