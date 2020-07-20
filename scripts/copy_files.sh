#!/bin/bash
read -p 'Host: ' host

scp zminstall.sh ubuntu@"$host":
scp ../zmeventnotification/zmeventnotification.ini ubuntu@"$host":
scp ../zmeventnotification/objectconfig.ini ubuntu@"$host":
scp ../zmeventnotification/secrets.ini ubuntu@"$host":
