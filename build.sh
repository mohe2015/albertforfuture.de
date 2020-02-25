#!/bin/sh

set -ex
git pull
BASE_URL=https://rc.albertforfuture.de/ npm run build
# find public/ -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.xml' -o -name '*.svg' \) -exec zopfli -v -i15 {} \;
sudo systemctl restart nginx