#!/bin/bash

sudo chmod a+x zminstall.sh
sudo ./zminstall.sh

sudo mv zmeventnotification.ini zmeventnotification
sudo mv secrets.ini zmeventnotification
sudo mv objectconfig.ini zmeventnotification/hook

cd zmeventnotification
sudo ./install.sh
