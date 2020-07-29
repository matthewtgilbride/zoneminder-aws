
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y

echo "mysql-server-5.7 mysql-server/root_password password root" | debconf-set-selections
echo "mysql-server-5.7 mysql-server/root_password_again password root" | debconf-set-selections

apt-get install lamp-server^ -y

add-apt-repository ppa:iconnor/zoneminder-1.34 -y
# add-apt-repository ppa:iconnor/zoneminder-master -y

apt-get update
apt-get upgrade -y
apt-get dist-upgrade -y

rm /etc/mysql/my.cnf
cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/my.cnf

sed -i '/\[mysqld\]/a sql_mode = NO_ENGINE_SUBSTITUTION' /etc/mysql/my.cnf

# sets the mapped memory to 75% instead of 50% so zm can consume more memory
echo "tmpfs /dev/shm tmpfs defaults,noexec,nosuid,size=75% 0 0" >> /etc/fstab

systemctl restart mysql

apt-get install zoneminder -y

chmod 740 /etc/zm/zm.conf
chown root:www-data /etc/zm/zm.conf
chown -R www-data:www-data /usr/share/zoneminder/

a2enmod cgi
a2enmod rewrite
a2enconf zoneminder

a2enmod expires
a2enmod headers

systemctl enable zoneminder
systemctl start zoneminder

sed -i '/\[Date\]/a date.timezone = America/New_York' /etc/php/7.2/apache2/php.ini
timedatectl set-timezone America/New_York

systemctl reload apache2

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
