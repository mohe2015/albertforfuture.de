#!/bin/sh

set -ex
# git pull
hugo --minify --baseURL $1
#find public/ -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.xml' -o -name '*.svg' \) -exec zopfli -v -i15 {} \;
