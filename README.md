# albertforfuture.de
Source code for website https://albertforfuture.de

# Setup (Debian 10)

```bash
sudo curl -L -O https://github.com/gohugoio/hugo/releases/download/v0.72.0/hugo_extended_0.72.0_Linux-64bit.deb
sudo dpkg -i hugo_extended_0.72.0_Linux-64bit.deb
sudo apt install sqlite3
npm install
BASE_URL=https://albertforfuture.de/ npm run build



node send-push.mjs '{"text": "Der Artikel thisistawesome ist online!", "url": "/thisisawesome/"}'
```
