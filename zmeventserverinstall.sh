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

git clone --single-branch --branch v5.15.6-matthewtgilbride https://github.com/matthewtgilbride/zmeventnotification.git

cd zmeventnotification && INSTALL_YOLOV3=no INSTALL_YOLOV4=no ./install.sh --install-es --install-hook --install-config --no-interactive
