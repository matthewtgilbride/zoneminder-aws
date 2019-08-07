# Running [Zoneminder](https://zoneminder.com/) on AWS

## Try it out

You'll need a few things set up in in your AWS account before you can get started.

1.  An ssh keypair, in case you need to ssh into the EC2 instance for troubleshooting.
2.  An AMI with Zoneminder pre-installed.
    I created one by manually starting up a Ubuntu 16.04 AMI and running the commands
    in [zminstall.sh](./zminstall.sh), and then saving the image.
    [zminstall.sh](./zminstall.sh) just automates the the zoneminder installation
    directions [here](https://zoneminder.readthedocs.io/en/stable/installationguide/ubuntu.html#easy-way-ubuntu-16-04).
3.  An ACM certificate for SSL.
4.  A domain name and hosted zone set up in Route 53

Include those variables in a .env (see [.env-sample](./.env-sample)) file,
and source it `. .env` to set the environment variables in your shell.

Then, run the following:

`npm install`

`npm run deploy`

You should end up with a stack created, and be able to access Zoneminder at `https://<hostname>/zm`

