# Steps to publish a new article

* Use hugo new to create the article

* Add content

* Set draft to false

* rebuild page

* check that url works (page.md -> /page/)

* publish

* send notification:
  cargo run --bin send_push '{"text": "Der Artikel thisistawesome ist online!", "url": "/thisisawesome/"}'
