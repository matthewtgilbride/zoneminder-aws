import { Construct } from "@aws-cdk/core";
import { IVpc, Peer, Port, SecurityGroup } from "@aws-cdk/aws-ec2";

interface NetworkConstructProps {
  vpc: IVpc
  localIp: string
}

export class SecurityConstruct extends Construct {
  public ec2SecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, { vpc, localIp }: NetworkConstructProps) {
    super(scope, id);

    // load balancer security group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ZM-lb-sg', {
      securityGroupName: 'zoneminder ec2 instance sg',
      vpc
    })

    this.ec2SecurityGroup.addIngressRule(Peer.ipv4(`${localIp}/32`), Port.tcp(22))
    this.ec2SecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(443))
    this.ec2SecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(80))
    this.ec2SecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(9000))
  }
}
