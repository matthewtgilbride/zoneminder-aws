apt-get update
apt-get install software-properties-common -y
apt-add-repository ppa:certbot/certbot -y
apt-get update
apt-get install certbot -y
apt-get install python3-certbot-dns-route53 -y
apt-get install certbot python-certbot-apache -y
chown -R www-data:root /etc/letsencrypt/
certbot certonly -d zoneminder.mattgilbride.com --non-interactive --agree-tos --email matthewtgilbride@@gmail.com --dns-route53
certbot -d zoneminder.mattgilbride.com --non-interactive --agree-tos --apache --redirect


