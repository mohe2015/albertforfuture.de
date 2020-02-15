#[derive(Queryable)]
pub struct Subscriber {
    pub id: i32,
    pub endpoint: String,
    pub key_p256dh: String,
    pub key_auth: String,
}