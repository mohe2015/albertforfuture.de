table! {
    subscribers (id) {
        id -> Nullable<Integer>,
        endpoint -> Text,
        key_p256dh -> Text,
        key_auth -> Text,
    }
}
