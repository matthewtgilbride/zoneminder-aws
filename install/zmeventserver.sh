# zmeventserver
apt-get install -y make gcc cpanminus

cpanm install Crypt::MySQL
cpanm install Config::IniFiles
cpanm install Crypt::Eksblowfish::Bcrypt

apt-get install -y libyaml-perl
cpanm install Net::WebSocket::Server

apt-get -y install libjson-perl

cpanm install LWP::Protocol::https

apt-get -y install python3-pip

apt-get -y install python3-opencv

pip3 install future

pip3 install opencv-contrib-python

mkdir /etc/zm/ssl

openssl req -x509 -nodes -days 4096 -newkey rsa:2048 -keyout /etc/zm/ssl/zoneminder.key -out /etc/zm/ssl/zoneminder.crt \
  -subj "/C=US/ST=Pennsylvania/L=Philadelphia/O=Matt Gilbride/OU=Zoneminder/CN=$DOMAIN_NAME"

chown www-data /etc/zm/ssl/zoneminder.crt
chown www-data /etc/zm/ssl/zoneminder.key

git clone --single-branch --branch v6.0.6-matthewtgilbride https://github.com/matthewtgilbride/zmeventnotification.git

cd zmeventnotification && INSTALL_YOLOV4=no ./install.sh --install-es --install-hook --install-config --no-interactive
