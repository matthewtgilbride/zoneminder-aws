# Running [Zoneminder](https://zoneminder.com/) on AWS

## AWS Account prerequisites

You'll need a couple of things from your AWS account before you can get started.

1.  Pick an AWS region (where things will run), 
2.  Your access key, secret key, and AWS account number
3.  An ssh keypair, in case you need to ssh into the EC2 instance for troubleshooting.
4.  The public IP address where your cameras live

Include those variables in a .env (see [.env-sample](./.env-sample)) file,
and source it `. .env` to set the environment variables in your shell.

Next, you'll need some things that I, personally, have set up in a [separate github project](https://github.com/matthewtgilbride/aws-infrastructure).

1.  A domain name and hosted zone
2.  A wildcard certificate e.g. `*.yourdomain.com`

Create two values in AWS Systems Manager Parameter store called `domainName` and `certificateArn`, respectively.

This project will look those values up, and setup zoneminder to run at `https://zoneminder.yourdomain.com/zm`

## Creating the zoneminder stack

Run the following at the root of the project:

`yarn`

`yarn deploy`

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
    *   To run: `yarn post:deploy` and follow the prompts
