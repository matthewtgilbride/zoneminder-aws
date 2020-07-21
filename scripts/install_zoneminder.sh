#!/bin/bash
read -p 'Host: ' host

ssh ubuntu@"$host" 'sudo chmod a+x zminstall.sh'
ssh ubuntu@"$host" 'sudo ./zminstall.sh'
