import { Construct } from "@aws-cdk/core";
import {
  BlockDeviceVolume,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  MachineImage,
  SecurityGroup,
  UserData
} from "@aws-cdk/aws-ec2";
import { readFileSync } from "fs";
import path from "path";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { Secret } from "@aws-cdk/aws-secretsmanager";
import { AccountPrincipal } from "@aws-cdk/aws-iam";

interface ZoneminderInstanceProps {
  vpc: IVpc,
  ec2SecurityGroup: SecurityGroup,
  sshKeyName: string,
  ebsVolumeSize: number,
  domainName: string,
  zmUser: string,
}

export class ZoneminderInstanceConstruct extends Construct {
  public ec2Instance: Instance

  constructor(scope: Construct, id: string, { vpc, ec2SecurityGroup, sshKeyName, ebsVolumeSize, domainName, zmUser }: ZoneminderInstanceProps) {
    super(scope, `${id}-ZoneminderInstanceConstruct`)

    new StringParameter(this, 'zmUser', {
      parameterName: 'zmUser',
      stringValue: zmUser
    })
    new StringParameter(this, 'zmApiUrl', {
      parameterName: 'zmApiUrl',
      stringValue: `https://zoneminder.${domainName}/zm/api`
    })

    const secret = new Secret(this, 'zmPassword', {
      secretName: 'zmPassword',
      generateSecretString: {
        excludePunctuation: true
      }
    })
    secret.grantRead({ grantPrincipal: new AccountPrincipal(process.env.AWS_ACCOUNT_NUMBER as string)})

    const zmInstall = readFileSync(path.resolve(process.cwd(), 'zminstall.sh'), { encoding: 'utf-8' })

    const userData = UserData.forLinux()
    userData.addCommands('git clone --single-branch --branch v5.15.6-matthewtgilbride https://github.com/matthewtgilbride/zmeventnotification.git')
    userData.addCommands(zmInstall)
    userData.addCommands(`cd zmeventnotification && INSTALL_YOLOV3=no INSTALL_YOLOV4=no ./install.sh --install-es --install-hook --install-config --no-interactive`)

    // ec2 instance
    this.ec2Instance = new Instance(this, 'ZM-ec2-instance', {
      vpc,
      userData,
      // Ubuntu 18.04
      machineImage: MachineImage.genericLinux({ 'us-east-1': 'ami-0ac80df6eff0e70b5' }),
      instanceType: InstanceType.of(InstanceClass.T3A, InstanceSize.MEDIUM),
      availabilityZone: 'us-east-1b',
      keyName: sshKeyName,
      securityGroup: ec2SecurityGroup,
      blockDevices: [{ deviceName: '/dev/sda1', volume: BlockDeviceVolume.ebs(ebsVolumeSize) }]
    })
  }

}
