# Running [Zoneminder](https://zoneminder.com/) on AWS

## AWS Account prerequisites

You'll need a few things set up in in your AWS account before you can get started.

1.  An ssh keypair, in case you need to ssh into the EC2 instance for troubleshooting.
2.  An AMI with Zoneminder pre-installed (see below).
3.  An ACM certificate for SSL.
4.  A domain name and hosted zone set up in Route 53

Include those variables in a .env (see [.env-sample](./.env-sample)) file,
and source it `. .env` to set the environment variables in your shell.

## Creating a zoneminder AMI

Before you can launch your stack on AWS, you'll need an EC2 AMI with Zoneminder installed.

*   Start up a Ubuntu 18.04 AMI and make sure you can ssh into it:

    `ssh -i <path-to-your-ssh-key> ubuntu@<image-ip>`
    
*   Copy the files from this project into the instance
    
    `./copy_files`, enter your image IP or public host name
        
*   Install Zoneminder 
        
    *   `./install_zoneminder.sh`
        
    *   This just automates the following:
    
        * zoneminder installation directions
        [here](https://zoneminder.readthedocs.io/en/latest/installationguide/ubuntu.html#easy-way-ubuntu-18-04-bionic).
        
        * installs other prerequisites for zmeventserver
        [here](https://zmeventnotification.readthedocs.io/en/latest/guides/install.html)
            
*   IF you are going to use zmeventserver:

    *   Look at the files in the `zmeventnotification` directory and tweak them to your liking
    
        *   create a `secrets.ini` file in that directory: **This file is gitignored because you should include your own!**
            
        *   You can diff these files against the zmeventserver github repo if you are curious as to the changes.

    *   `./install_zmeventserver.sh`
        
        
        
*   Save the image from the AWS console.

## Creating the zoneminder stack

Run the following at the root of the project:

`npm install`

`npm run deploy`

You should end up with a stack created, and be able to access Zoneminder at `https://<hostname>/zm`

## Manual zoneminder settings 

The FIRST thing you should do is log into the zoneminder console and manually configure the following options via the UI;

*   <your-host>/zm/index.php?view=options&tab=users

    *   delete the admin user and create your own super user
    
*   IF you are not going to use an automated script (see below): <your-host>/zm/index.php?view=options

    *   OPT_USE_AUTH turn on
    *   AUTH_HASH_SECRET less than 6 characters https://github.com/ZoneMinder/ZoneMinder/issues/1552
    *   AUTH_HASH_LOGINS turn on
    *   Set timezone accordingly
    
## Automated settings, monitor, and zone setup
    
* I have a utility script that automates the process of configuration, monitor, and zone setup for me.

    *   Note that the config files it uses are quite specific to my setup, but you can use them as inspiration
    *   To run: `npm run after-user-setup` and follow the prompts
