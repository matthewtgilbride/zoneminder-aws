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
  ami: string;
  installZoneminder: boolean;
  installEventServer: boolean;
}

export class ZoneminderInstanceConstruct extends Construct {
  public ec2Instance: Instance

  constructor(
    scope: Construct,
    id: string,
    {
      vpc,
      ec2SecurityGroup,
      sshKeyName,
      ebsVolumeSize,
      ami,
      installZoneminder = true,
      installEventServer = true
    }: ZoneminderInstanceProps) {
    super(scope, `${id}-ZoneminderInstanceConstruct`)

    const userData = UserData.forLinux()
    if (installZoneminder) {
      const zoneminderInstall = readFileSync(path.resolve(process.cwd(), 'zoneminderinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(zoneminderInstall)
    }
    if (installEventServer) {
      const zmeventserverInstall = readFileSync(path.resolve(process.cwd(), 'zmeventserverinstall.sh'), { encoding: 'utf-8' })
      userData.addCommands(zmeventserverInstall)
    }

    // ec2 instance
    this.ec2Instance = new Instance(this, 'ZM-ec2-instance', {
      vpc,
      userData: installZoneminder || installEventServer ? userData : undefined,
      machineImage: MachineImage.genericLinux({ 'us-east-1': ami }),
      instanceType: InstanceType.of(InstanceClass.T3A, InstanceSize.MEDIUM),
      availabilityZone: 'us-east-1b',
      keyName: sshKeyName,
      securityGroup: ec2SecurityGroup,
      blockDevices: [{ deviceName: '/dev/sda1', volume: BlockDeviceVolume.ebs(ebsVolumeSize) }]
    })
  }

}
