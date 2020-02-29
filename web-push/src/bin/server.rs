extern crate diesel;
extern crate dotenv;
extern crate pretty_env_logger;

use warp::Filter;

use push::subscribe;

#[tokio::main]
async fn main() {
    pretty_env_logger::init();

    let subscribe_path = warp::path!("api" / "v1" / "add_push")
        .and(warp::post())
        .and(warp::body::content_length_limit(1024 * 16))
        .and(warp::body::json())
        .and_then(subscribe);

    warp::serve(subscribe_path)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
