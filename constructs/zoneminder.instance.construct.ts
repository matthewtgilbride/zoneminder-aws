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
  fullyQualifiedDomainName: string,
  ec2SecurityGroup: SecurityGroup,
  sshKeyName: string,
  ebsVolumeSize: number,
  ami: string;
  role: Role;
  installZoneminder?: boolean;
  installCert?: boolean;
  installEventServer?: boolean;
  installS3Backup?: boolean;
  installCwAgent?: boolean;
  zmUser: string;
}

export class ZoneminderInstanceConstruct extends Construct {
  public ec2Instance: Instance

  constructor(
    scope: Construct,
    id: string,
    {
      vpc,
      fullyQualifiedDomainName,
      ec2SecurityGroup,
      sshKeyName,
      ebsVolumeSize,
      role,
      ami,
      installZoneminder = true,
      installCert = true,
      installEventServer = true,
      installS3Backup = true,
      installCwAgent = true,
      zmUser,
    }: ZoneminderInstanceProps) {
    super(scope, `${id}-ZoneminderInstanceConstruct`)

    const userData = UserData.forLinux()
    userData.addCommands('apt-get install awscli -y')

    userData.addCommands(`export DOMAIN_NAME=${fullyQualifiedDomainName}`)
    userData.addCommands(`echo "export DOMAIN_NAME=${fullyQualifiedDomainName}" > /etc/profile.d/domain_name.sh`)
    userData.addCommands('chmod a+x /etc/profile.d/domain_name.sh')

    userData.addCommands(`export ZM_USER=${zmUser}`)
    userData.addCommands(`echo "export ZM_USER=${zmUser}" > /etc/profile.d/zm_user.sh`)
    userData.addCommands('chmod a+x /etc/profile.d/zm_user.sh')

    if (installZoneminder) {
      const zoneminderInstall = readFileSync(path.resolve(process.cwd(), 'install/zoneminder.sh'), { encoding: 'utf-8' })
      userData.addCommands(zoneminderInstall)
      const insertUser = readFileSync(path.resolve(process.cwd(), 'install/insert_user.sh'), { encoding: 'utf-8' })
      userData.addCommands(insertUser)
      userData.addCommands(`echo "export DOMAIN_NAME=${fullyQualifiedDomainName}" >> /etc/apache2/envvars`)
      userData.addCommands('systemctl restart apache2')
    }
    if (installCert) {
      const certInstall = readFileSync(path.resolve(process.cwd(), 'install/sslcert.sh'), { encoding: 'utf-8' })
      userData.addCommands(certInstall)
    }
    if (installEventServer) {
      const zmeventserverInstall = readFileSync(path.resolve(process.cwd(), 'install/zmeventserver.sh'), { encoding: 'utf-8' })
      userData.addCommands(zmeventserverInstall)
    }
    if (installS3Backup) {
      const nodeInstall = readFileSync(path.resolve(process.cwd(), 'install/node_aws_sdk.sh'), { encoding: 'utf-8' })
      userData.addCommands(nodeInstall)
      const backupScript = readFileSync(path.resolve(process.cwd(), 'scripts/zm-s3-upload.js'), { encoding: 'utf-8' }).replace(/'/g, `"`)
      userData.addCommands(`echo '${backupScript}' > /usr/bin/zm-s3-upload.js`)
      userData.addCommands('chown www-data:www-data /usr/bin/zm-s3-upload.js')
      userData.addCommands('chmod u+x /usr/bin/zm-s3-upload.js')
    }
    if (installCwAgent) {
      const agentInstall = readFileSync(path.resolve(process.cwd(), 'install/cwagent/cwagent_install.sh'), { encoding: 'utf-8' })
      userData.addCommands(agentInstall)
      const agentConfig = readFileSync(path.resolve(process.cwd(), 'install/cwagent/config.json'), { encoding: 'utf-8' })
      userData.addCommands(`echo '${agentConfig}' > /opt/aws/amazon-cloudwatch-agent/bin/config.json`)
      const agentRun = readFileSync(path.resolve(process.cwd(), 'install/cwagent/cwagent_run.sh'), { encoding: 'utf-8' })
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
