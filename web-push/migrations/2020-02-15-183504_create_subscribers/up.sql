-- Your SQL goes here
CREATE TABLE subscribers (
    id INTEGER PRIMARY KEY NOT NULL,
    endpoint VARCHAR(1023) NOT NULL,
    key_p256dh VARCHAR(255) NOT NULL,
    key_auth VARCHAR(127) NOT NULL
)