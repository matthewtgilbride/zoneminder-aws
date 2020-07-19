#!/bin/bash

read -p 'Host: ' host
read -p 'Key name (no extension): ' key_path

scp -i ~/.ssh/"$key_path".pem zminstall.sh ubuntu@"$host":
scp -i ~/.ssh/"$key_path".pem zmeventnotification.ini ubuntu@"$host":
scp -i ~/.ssh/"$key_path".pem objectconfig.ini ubuntu@"$host":
scp -i ~/.ssh/"$key_path".pem secrets.ini ubuntu@"$host":

scp -i ~/.ssh/"$key_path".pem instance_install.sh ubuntu@"$host":
