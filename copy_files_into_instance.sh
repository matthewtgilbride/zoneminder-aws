#!/bin/bash

read -p 'Host: ' host
read -p 'Key path: ' key_path

scp -i "$key_path" zminstall.sh ubuntu@"$host":
scp -i "$key_path" zmeventnotification.ini ubuntu@"$host":
scp -i "$key_path" objectconfig.ini ubuntu@"$host":
scp -i "$key_path" secrets.ini ubuntu@"$host":

scp -i "$key_path" instance_install.sh ubuntu@"$host":
