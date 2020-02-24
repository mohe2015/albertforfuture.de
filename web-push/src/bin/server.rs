extern crate diesel;
extern crate dotenv;

use warp::Filter;

use push::subscribe;
use push::unsubscribe;

#[tokio::main]
async fn main() {

    let subscribe_path = warp::path!("api" / "v1" / "add_push")
        .and(warp::post())
        .and(warp::body::content_length_limit(1024 * 16))
        .and(warp::body::json())
        .and_then(subscribe);

    let unsubscribe_path = warp::path!("api" / "v1" / "remove_push")
        .and(warp::post())
        .and(warp::body::content_length_limit(1024 * 16))
        .and(warp::body::json())
        .and_then(unsubscribe);

    let paths = subscribe_path.or(unsubscribe_path);

    warp::serve(paths)
        .tls()
        .cert_path("../../localhost.pem")
        .key_path("../../localhost-key.pem")
        .run(([127, 0, 0, 1], 3030))
        .await;
}