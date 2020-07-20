#!/bin/bash
read -p 'Host: ' host

ssh ubuntu@"$host" 'sudo mv zmeventnotification.ini zmeventnotification'
ssh ubuntu@"$host" 'sudo mv secrets.ini zmeventnotification'
ssh ubuntu@"$host" 'sudo mv objectconfig.ini zmeventnotification/hook'

ssh ubuntu@"$host" 'sudo ./install.sh --install-es --install-hook --install-config --no-interactive'
