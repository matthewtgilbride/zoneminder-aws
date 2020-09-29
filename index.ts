import { App, Stack, StackProps } from '@aws-cdk/core';
import { SecurityConstruct } from "./constructs/security.construct";
import { Vpc } from "@aws-cdk/aws-ec2";
import { ZoneminderInstanceConstruct } from "./constructs/zoneminder.instance.construct";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { DnsConstruct } from "./constructs/dns.construct";
import { ParameterSecretConstruct } from "./constructs/parameter-secret.construct";
import { S3Construct } from "./constructs/s3.construct";


class ZoneminderStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "ZM-vpc", { isDefault: true });
    const localIp = process.env.LOCAL_IP as string;

    const domainName = StringParameter.valueFromLookup(this, 'domainName')
    const stackName = id;
    const fullyQualifiedDomainName = `${id}.${domainName}`

    const { ec2SecurityGroup } = new SecurityConstruct(this, `${id}-security`, {
      vpc,
      localIp
    })

    const { s3Role } = new S3Construct(this, `${id}-S3`, { fullyQualifiedDomainName })

    const { ec2Instance } = new ZoneminderInstanceConstruct(this, `${id}-ec2`, {
      vpc,
      fullyQualifiedDomainName,
      ec2SecurityGroup,
      sshKeyName: 'zoneminder-ami',
      ebsVolumeSize: 10,
      installEventServer: true,
      installZoneminder: true,
      installS3Backup: true,
      installCert: true,
      installCwAgent: true,
      // Ubuntu 18.04
      ami: 'ami-0ac80df6eff0e70b5',
      role: s3Role,
    })

    new DnsConstruct(this, `${id}-dns`, {
      localIp,
      domainName,
      stackName,
      instance: ec2Instance
    })

    // store off parameters and secrets we may want to use later
    new ParameterSecretConstruct(this, `${id}-params-secrets`, {
      zmUser: 'mtg5014',
      domainName,
      stackName,
    })
  }
}

const app = new App()
new ZoneminderStack(app, 'zmtest', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.AWS_ACCOUNT_NUMBER,
  },
});



