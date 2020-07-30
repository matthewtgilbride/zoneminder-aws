import { App, Stack, StackProps } from '@aws-cdk/core';
import { SecurityConstruct } from "./constructs/security.construct";
import { Vpc } from "@aws-cdk/aws-ec2";
import { ZoneminderInstanceConstruct } from "./constructs/zoneminder.instance.construct";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { AlbConstruct } from "./constructs/alb.construct";
import { DnsConstruct } from "./constructs/dns.construct";
import { ParameterSecretConstruct } from "./constructs/parameter-secret.construct";


class ZoneminderStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "ZM-vpc", { isDefault: true });
    const localIp = process.env.LOCAL_IP as string;

    const domainName = StringParameter.valueFromLookup(this, 'domainName')

    const { ec2SecurityGroup, loadBalancerSecurityGroup } = new SecurityConstruct(this, `${id}-security`, {
      vpc,
      localIp
    })

    const { ec2Instance } = new ZoneminderInstanceConstruct(this, `${id}-ec2`, {
      vpc,
      ec2SecurityGroup,
      sshKeyName: 'zoneminder-ami',
      ebsVolumeSize: 100,
      installEventServer: true,
      installZoneminder: true,
      // Ubuntu 18.04
      ami: 'ami-0ac80df6eff0e70b5'
    })

    const { alb } = new AlbConstruct(this, `${id}-alb`, {
      vpc,
      loadBalancerSecurityGroup,
      ec2Instance
    })

    new DnsConstruct(this, `${id}-dns`, {
      alb,
      localIp,
      domainName
    })

    // store off parameters and secrets we may want to use later
    new ParameterSecretConstruct(this, `${id}-params-secrets`, {
      zmUser: 'mtg5014',
      domainName
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



