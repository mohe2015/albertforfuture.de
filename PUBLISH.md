# Steps to publish a new article

* Use hugo new to create the article

* Add content

* Set draft to false

* rebuild page

* check that url works (page.md -> /page/)

* publish

* send notification:
  cargo run --bin send_push '{"text": "Der Artikel thisistawesome ist online!", "url": "/thisisawesome/"}'


# Steps to create a new server

cd Documents/Websites/albertforfuture.de/web-push/
scp target/release/server selfmade4u.de:/var/www/albertforfuture.de/web-push/
scp target/release/send_push selfmade4u.de:/var/www/albertforfuture.de/web-push/
scp private_key.pem selfmade4u.de:/var/www/albertforfuture.de/web-push/
scp test.db selfmade4u.de:/var/www/albertforfuture.de/web-push/

ssh selfmade4u.de

cd /var/www
git clone https://github.com/mohe2015/albertforfuture.de

sudo certbot certonly -d rc.albertforfuture.de
sudo ln -s /etc/letsencrypt/live/rc.albertforfuture.de/fullchain.pem localhost.pem
sudo ln -s /etc/letsencrypt/live/rc.albertforfuture.de/privkey.pem localhost-key.pem

cd albertforfuture.de

git pull
npm install
BASE_URL=https://rc.albertforfuture.de/ npm run build

cp nginx.conf /etc/nginx/sites-enabled/albertforfuture.de
sudo nginx reload

cd web-push
tmux
sudo ./server