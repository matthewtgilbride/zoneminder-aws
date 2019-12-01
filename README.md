# Running [Zoneminder](https://zoneminder.com/) on AWS

## Creating a zoneminder AMI

Before you can launch your stack on AWS, you'll need an EC2 AMI with Zoneminder installed.

*   Start up a Ubuntu 18.04 AMI and make sure you can ssh into it:

    `ssh -i <path-to-your-ssh-key> ubuntu@<image-ip>`
    
*   scp [zminstall.sh](./zminstall.sh) into the image:
    
    `scp zminstall.sh ubuntu@<image-ip>:`
        
*   ssh into the image and run the installation script: 
        
    `sudo chmod a+x zminstall.sh && sudo ./zminstall.sh`
        
    *   zminstall.sh just automates the the following:
    
        * zoneminder installation directions
        [here](https://zoneminder.readthedocs.io/en/latest/installationguide/ubuntu.html#easy-way-ubuntu-18-04-bionic).
        
        * zmeventserver installation directions
        [here](https://zmeventnotification.readthedocs.io/en/latest/guides/install.html)
        
            *   instead of checking out the most recent stable release,
                it checks out v4.6.1, the stable release at time of writing this README.
            
*   once the event server is installed, overwrite the configuration with the one in this project

    *   scp the config file at the root of this project over the default one
    
        `scp zmeventnotification.ini ubuntu@<image-ip>:`
        
        `mv zmeventnotificationlini ./zmeventnotification`  
        
        It has the following changes:
        
        *   SSL is turned off.  The AWS ALB takes care of SSL termination.
        *   Logging is turned on
        *   Machine learning hooks are turned on
        
*   Save the image from the AWS console.

## AWS Account prerequisites

You'll need a few things set up in in your AWS account before you can get started.

1.  An ssh keypair, in case you need to ssh into the EC2 instance for troubleshooting.
2.  An AMI with Zoneminder pre-installed (see above).
3.  An ACM certificate for SSL.
4.  A domain name and hosted zone set up in Route 53

Include those variables in a .env (see [.env-sample](./.env-sample)) file,
and source it `. .env` to set the environment variables in your shell.

## Creating the zoneminder stack

Run the following at the root of the project:

`npm install`

`npm run deploy`

You should end up with a stack created, and be able to access Zoneminder at `https://<hostname>/zm`

## Manual zoneminder settings 

The FIRST thing you should do is log into the zoneminder console and manually configure the following options via the UI;

*   <your-host>/zm/index.php?view=options&tab=users

    *   delete the admin user and create your own super user
    
*   <your-host>/zm/index.php?view=options

    *   OPT_USE_AUTH turn on
    *   AUTH_HASH_SECRET less than 6 characters https://github.com/ZoneMinder/ZoneMinder/issues/1552
    *   AUTH_HASH_LOGINS turn on
    
**Note, in my case, I save another AMI after I've performed these steps as well as configuring a couple of monitors**
    
## Configuring zm event server

*   override `zmeventnotification/secrets.ini` with your values.

*   move zmeventnotification.ini into the zmeventserver directory

    `sudo mv zmeventnotification.ini zmeventnotification`
    
*   run the [event server installation script](./zmeventnotification/install.sh) provided:
    
        `cd zmeventnotification && sudo ./install.sh`

*   Manually upate zoneminder via the UI
    *   OPT_USE_EVENTNOTIFICATION turn on
    *   Restart zoneminder
    
        
