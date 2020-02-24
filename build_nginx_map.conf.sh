#!/bin/sh
cat > public/nginx_map.conf <<EOF
map $cookie_custom_css $custom_css {
  "~$(md5sum public/custom.min.css | awk '{print $1}')$" "";
  default "</custom.min.css>; as=style; rel=preload";
}
map $cookie_custom_css $custom_css_cookie {
  "~$(md5sum public/custom.min.css | awk '{print $1}')$" "";
  default "custom_css=$(md5sum public/custom.min.css | awk '{print $1}'); Max-Age=315360000; Path=/";
}

map $cookie_logo_svg $logo_svg {
  "~$(md5sum public/logo.min.svg | awk '{print $1}')$" "";
  default "</logo.min.svg>; as=image; rel=preload";
}
map $cookie_logo_svg $logo_svg_cookie {
  "~$(md5sum public/logo.min.svg | awk '{print $1}')$" "";
  default "logo_svg=$(md5sum public/logo.min.svg | awk '{print $1}'); Max-Age=315360000; Path=/";
}
EOF