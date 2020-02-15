use super::schema::subscribers;

#[derive(Queryable)]
pub struct Subscriber {
    pub id: i32,
    pub endpoint: String,
    pub key_p256dh: String,
    pub key_auth: String,
}

#[derive(Insertable)]
#[table_name="subscribers"]
pub struct NewSubscriber<'a> {
    pub endpoint: &'a str,
    pub key_p256dh: &'a str,
    pub key_auth: &'a str,
}