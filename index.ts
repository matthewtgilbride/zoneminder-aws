import { App, Stack, StackProps } from '@aws-cdk/core';
import { SecurityConstruct } from "./constructs/security.construct";
import { Vpc } from "@aws-cdk/aws-ec2";
import { ZoneminderInstanceConstruct } from "./constructs/zoneminder.instance.construct";
import { AlbConstruct } from "./constructs/alb.construct";
import { DnsConstruct } from "./constructs/dns.construct";


class ZoneminderStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "ZM-vpc", { isDefault: true });
    const localIp = process.env.LOCAL_IP as string;

    const { ec2SecurityGroup, loadBalancerSecurityGroup } = new SecurityConstruct(this, `${id}-security`, {
      vpc,
      localIp
    })

    const { ec2Instance } = new ZoneminderInstanceConstruct(this, `${id}-ec2`, {
      vpc,
      ec2SecurityGroup,
      sshKeyName: 'zoneminder-ami',
      ebsVolumeSize: 100
    })

    const { alb } = new AlbConstruct(this, `${id}-alb`, {
      vpc,
      loadBalancerSecurityGroup,
      ec2Instance
    })

    new DnsConstruct(this, `${id}-dns`, {
      alb,
      localIp
    })
  }
}

const app = new App()
new ZoneminderStack(app, 'zoneminder', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.AWS_ACCOUNT_NUMBER,
  },
});



