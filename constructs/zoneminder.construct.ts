import { Construct, Duration } from "@aws-cdk/core";
import { CfnInstance, Peer, Port, SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  CfnListener,
  InstanceTarget,
  SslPolicy,
  TargetType
} from "@aws-cdk/aws-elasticloadbalancingv2";
import { HostedZone, RecordSet, RecordTarget, RecordType } from "@aws-cdk/aws-route53";
import { StringParameter } from "@aws-cdk/aws-ssm";

export interface ZoneminderProps {
  localIp: string,
  amiImageId: string,
  sshKeyName: string,
  ebsVolumeSize: number,
}

export class ZoneminderConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ZoneminderProps) {
    super(scope, `${id}-ZoneminderConstruct`)

    const domainName = StringParameter.valueFromLookup(this, 'domainName')
    const certificateArn = StringParameter.valueFromLookup(this, 'certificateArn');

    const { localIp, amiImageId, sshKeyName, ebsVolumeSize } = props

    const vpc = Vpc.fromLookup(this, "ZM-vpc", { isDefault: true });
    const zone = HostedZone.fromLookup(this, `${id}-HostedZone`, {
      domainName,
    })

    // load balancer security group
    const loadBalancerSecurityGroup = new SecurityGroup(this, 'ZM-lb-sg', {
      securityGroupName: 'zoneminder load balancer sg',
      vpc
    })

    loadBalancerSecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(443))
    loadBalancerSecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(80))
    loadBalancerSecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(9000))
    // todo remove?
    loadBalancerSecurityGroup.addIngressRule(loadBalancerSecurityGroup, Port.allTraffic())

    // ec2 security group
    const ec2SecurityGroup = new SecurityGroup(this, 'ZM-ec2-sg', {
      securityGroupName: 'zoneminder ec2 instance sg',
      vpc,
    })

    ec2SecurityGroup.addIngressRule(Peer.ipv4(`${localIp}/32`), Port.tcp(22))
    ec2SecurityGroup.addIngressRule(loadBalancerSecurityGroup, Port.tcp(80))
    ec2SecurityGroup.addIngressRule(loadBalancerSecurityGroup, Port.tcp(9000))

    // ec2 instance
    const ec2Instance = new CfnInstance(this, 'ZM-ec2-instance', {
      imageId: amiImageId,
      instanceType: 't3a.medium',
      availabilityZone: 'us-east-1b',
      keyName: sshKeyName,
      securityGroupIds: [ec2SecurityGroup.securityGroupId],
      blockDeviceMappings: [{ deviceName: '/dev/sda1', ebs: { deleteOnTermination: false, encrypted: false, volumeSize: ebsVolumeSize }}]
    })

    // ALB
    const alb = new ApplicationLoadBalancer(this, 'ZM-lb', {
      vpc,
      internetFacing: true,
      securityGroup: loadBalancerSecurityGroup,
    })

    // redirect HTTP to HTTPS
    new CfnListener(this, 'ZM-http-listener', {
      loadBalancerArn: alb.loadBalancerArn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'redirect',
        redirectConfig: {
          statusCode: 'HTTP_301',
          protocol: 'HTTPS',
          host: '#{host}',
          port: '443',
          path: '/#{path}',
          query: '#{query}'
        }
      }]
    })

    const httpsTargetGroup = new ApplicationTargetGroup(this, 'ZM-lb-tg', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.INSTANCE,
      vpc,
      targets: [new InstanceTarget(ec2Instance.ref, 80)]
    })

    const httpsListener = alb.addListener('ZM-https-listener', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      sslPolicy: SslPolicy.RECOMMENDED,
      certificateArns: [certificateArn]
    })
    httpsListener.addTargetGroups('ZM-http-listener-tg', { targetGroups: [httpsTargetGroup]})

    const wsTargetGroup = new ApplicationTargetGroup(this, 'ZM-ws-tg', {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 9000,
      targetType: TargetType.INSTANCE,
      targets: [new InstanceTarget(ec2Instance.ref, 9000)]
    })

    const wsListener = alb.addListener('ZM-ws-listener', {
      port: 9000,
      protocol: ApplicationProtocol.HTTPS,
      sslPolicy: SslPolicy.RECOMMENDED,
      certificateArns: [certificateArn]
    })
    wsListener.addTargetGroups('ZM-ws-listener-tg', { targetGroups: [wsTargetGroup]})

    // Route 53
    new RecordSet(this, 'ZM-rs', {
      zone,
      recordName: `zoneminder.${domainName}`,
      recordType: RecordType.CNAME,
      // todo: make longer once stable
      ttl: Duration.seconds(60),
      target: RecordTarget.fromValues(alb.loadBalancerDnsName)
    })
  }

}
