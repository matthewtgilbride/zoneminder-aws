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

interface ZoneminderInstanceProps {
  vpc: IVpc,
  ec2SecurityGroup: SecurityGroup,
  sshKeyName: string,
  ebsVolumeSize: number,
}

export class ZoneminderInstanceConstruct extends Construct {
  public ec2Instance: Instance

  constructor(scope: Construct, id: string, { vpc, ec2SecurityGroup, sshKeyName, ebsVolumeSize }: ZoneminderInstanceProps) {
    super(scope, `${id}-ZoneminderInstanceConstruct`)

    const zmInstall = readFileSync(path.resolve(process.cwd(), 'zminstall.sh'), { encoding: 'utf-8' })
    const secrets = readFileSync(path.resolve(process.cwd(), 'secrets.ini'), { encoding: 'utf-8' })
    const userData = UserData.forLinux()

    userData.addCommands(zmInstall)
    userData.addCommands(`echo '${secrets}' > zmeventnotification/secrets.ini`)
    userData.addCommands(`./zmeventnotification/install.sh --install-es --install-hook --install-config --no-interactive`)

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
