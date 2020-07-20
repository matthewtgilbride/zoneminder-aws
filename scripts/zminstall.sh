
export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get upgrade -y

sudo echo "mysql-server-5.7 mysql-server/root_password password root" | sudo debconf-set-selections
sudo echo "mysql-server-5.7 mysql-server/root_password_again password root" | sudo debconf-set-selections

sudo apt-get install lamp-server^ -y

add-apt-repository ppa:iconnor/zoneminder-1.34 -y
# sudo add-apt-repository ppa:iconnor/zoneminder-master -y

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade -y

sudo rm /etc/mysql/my.cnf
sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/my.cnf

sudo sed -i '/\[mysqld\]/a sql_mode = NO_ENGINE_SUBSTITUTION' /etc/mysql/my.cnf

# sets the mapped memory to 75% instead of 50% so zm can consume more memory
sudo echo "tmpfs /dev/shm tmpfs defaults,noexec,nosuid,size=75% 0 0" >> /etc/fstab

sudo systemctl restart mysql

sudo apt-get install zoneminder -y

sudo chmod 740 /etc/zm/zm.conf
sudo chown root:www-data /etc/zm/zm.conf
sudo chown -R www-data:www-data /usr/share/zoneminder/

sudo a2enmod cgi
sudo a2enmod rewrite
sudo a2enconf zoneminder

sudo a2enmod expires
sudo a2enmod headers

sudo systemctl enable zoneminder
sudo systemctl start zoneminder

sudo sed -i '/\[Date\]/a date.timezone = America/New_York' /etc/php/7.2/apache2/php.ini
sudo timedatectl set-timezone America/New_York

sudo systemctl reload apache2

# zmeventserver
sudo apt-get install -y make gcc cpanminus

sudo cpanm install Crypt::MySQL
sudo cpanm install Config::IniFiles
sudo cpanm install Crypt::Eksblowfish::Bcrypt

sudo apt-get install -y libyaml-perl
sudo cpanm install Net::WebSocket::Server

sudo apt-get -y install libjson-perl

sudo cpanm install LWP::Protocol::https

sudo apt-get -y install python3-pip

sudo apt-get -y install python3-opencv

sudo pip3 install future

sudo -H pip3 install opencv-contrib-python

git clone https://github.com/pliablepixels/zmeventnotification.git

cd zmeventnotification

git fetch --tags

git checkout $(git describe --tags $(git rev-list --tags --max-count=1))