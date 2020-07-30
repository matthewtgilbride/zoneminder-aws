
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

systemctl restart apache2
