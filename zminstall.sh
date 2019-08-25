
export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get upgrade -y

sudo echo "mysql-server-5.7 mysql-server/root_password password root" | sudo debconf-set-selections
sudo echo "mysql-server-5.7 mysql-server/root_password_again password root" | sudo debconf-set-selections

sudo apt-get install lamp-server^ -y

sudo add-apt-repository ppa:iconnor/zoneminder -y
sudo add-apt-repository ppa:iconnor/zoneminder-1.32 -y

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade -y

sudo rm /etc/mysql/my.cnf
sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/my.cnf

sudo sed -i '/\[mysqld\]/a sql_mode = NO_ENGINE_SUBSTITUTION' /etc/mysql/my.cnf

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

sudo sed -i '/\[Date\]/a date.timezone = America/New_York' /etc/php/7.0/apache2/php.ini
sudo timedatectl set-timezone America/New_York

sudo systemctl reload apache2
