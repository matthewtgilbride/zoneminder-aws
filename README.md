# Running [Zoneminder](https://zoneminder.com/) on AWS

## Try it out

You'll need a few things set up in in your AWS account before you can get started.

1.  An ssh keypair, in case you need to ssh into the EC2 instance for troubleshooting.
2.  An AMI with Zoneminder pre-installed (see below).
3.  An ACM certificate for SSL.
4.  A domain name and hosted zone set up in Route 53

Include those variables in a .env (see [.env-sample](./.env-sample)) file,
and source it `. .env` to set the environment variables in your shell.

Then, run the following:

`npm install`

`npm run deploy`

You should end up with a stack created, and be able to access Zoneminder at `https://<hostname>/zm`

The FIRST thing you should do is log into the zoneminder console and manually configure the following options via the UI;

*   <your-host>/zm/index.php?view=options
    *   OPT_USE_AUTH turn on
    *   AUTH_HASH_SECRET less than 6 characters https://github.com/ZoneMinder/ZoneMinder/issues/1552
    *   AUTH_HASH_LOGINS turn on
    *   If you are running zmeventserver...
        *   OPT_USE_EVENTNOTIFICATION turn on
        *   Restart zoneminder
    
*   <your-host>/zm/index.php?view=options&tab=users
    *   delete the admin user and create your own super user
    
    
### Creating a zoneminder AMI

*   Just Zoneminder
    *   Start up a Ubuntu 16.04 AMI
    *   scp [zminstall.sh](./zminstall.sh) into the image: `scp zminstall.sh ubuntu@<image-ip>:`
    *   ssh into the image: `sudo chmod a+x zminstall.sh`, then `sudo ./zminstall.sh`
        *   zminstall.sh just automates the the zoneminder installation directions
            [here](https://zoneminder.readthedocs.io/en/stable/installationguide/ubuntu.html#easy-way-ubuntu-16-04).
*   Zoneminder and [zmeventserver](https://github.com/pliablepixels/zmeventnotification)
    *   Repeat the procedure above for [zmeventserverinstall.sh](./zmeventserverinstall.sh).
        *   zmeventserverinstall.sh just automates the installation directions
            [here](https://zmeventnotification.readthedocs.io/en/latest/guides/install.html)
    *   scp the [zmeventnotification](./zmeventnotification) directory into the image (you will need the -r flag `scp -r`)
        *   this is just a clone of zmeventnotification, but with ssl turned off in zmeventnotification.ini
        *   The AWS ALB takes care of SSL termination
    *   run the [installation script](./zmeventnotification/install.sh) provided: `cd zmeventnotification`, then `sudo ./install.sh`
*   Save the image from the AWS console.

