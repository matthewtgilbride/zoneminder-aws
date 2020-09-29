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
import { Role } from "@aws-cdk/aws-iam";

interface ZoneminderInstanceProps {
  vpc: IVpc,
  domainName: string,
  ec2SecurityGroup: SecurityGroup,
  sshKeyName: string,
  ebsVolumeSize: number,
  ami: string;
  role: Role;
  installZoneminder: boolean;
  installCert: boolean;
  installEventServer: boolean;
  installNodeAws: boolean;
  installCwAgent: boolean;
}

export class ZoneminderInstanceConstruct extends Construct {
  public ec2Instance: Instance

  constructor(
    scope: Construct,
    id: string,
    {
      vpc,
      domainName,
      ec2SecurityGroup,
      sshKeyName,
      ebsVolumeSize,
      role,
      ami,
      installZoneminder = true,
      installCert = true,
      installEventServer = true,
      installNodeAws = true,
      installCwAgent = true,
    }: ZoneminderInstanceProps) {
    super(scope, `${id}-ZoneminderInstanceConstruct`)

    const userData = UserData.forLinux()
    userData.addCommands('apt-get install awscli -y')
    userData.addCommands(`export DOMAIN_NAME=${domainName}`)
    userData.addCommands(`echo "export DOMAIN_NAME=${domainName}" > /etc/profile.d/domain_name.sh`)
    if (installZoneminder) {
      const zoneminderInstall = readFileSync(path.resolve(process.cwd(), 'install/zoneminderinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(zoneminderInstall)
    }
    if (installCert) {
      const certInstall = readFileSync(path.resolve(process.cwd(), 'install/sslcertinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(certInstall)
    }
    if (installEventServer) {
      const zmeventserverInstall = readFileSync(path.resolve(process.cwd(), 'install/zmeventserverinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(zmeventserverInstall)
    }
    if (installNodeAws) {
      const nodeInstall = readFileSync(path.resolve(process.cwd(), 'install/nodeawsinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(nodeInstall)
    }
    if (installCwAgent) {
      const agentInstall = readFileSync(path.resolve(process.cwd(), 'install/cwagent/cwagentinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(agentInstall)
      const agentConfig = readFileSync(path.resolve(process.cwd(), 'install/cwagent/config.json'), { encoding: 'utf-8' })
      userData.addCommands(`echo '${agentConfig}' > /opt/aws/amazon-cloudwatch-agent/bin/config.json`)
      const agentRun = readFileSync(path.resolve(process.cwd(), 'install/cwagent/runcwagent.sh'), { encoding: 'utf-8' })
      userData.addCommands(agentRun)
    }

    // ec2 instance
    this.ec2Instance = new Instance(this, 'ZM-ec2-instance', {
      vpc,
      userData,
      role,
      machineImage: MachineImage.genericLinux({ 'us-east-1': ami }),
      instanceType: InstanceType.of(InstanceClass.T3A, InstanceSize.MEDIUM),
      availabilityZone: 'us-east-1b',
      keyName: sshKeyName,
      securityGroup: ec2SecurityGroup,
      blockDevices: [{ deviceName: '/dev/sda1', volume: BlockDeviceVolume.ebs(ebsVolumeSize) }],
    })

  }

}
