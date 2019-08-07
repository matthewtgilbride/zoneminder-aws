import { App, Stack, StackProps } from '@aws-cdk/core';
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


class ZoneminderStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "ZM-vpc", { isDefault: true });

    // load balancer security group
    const loadBalancerSecurityGroup = new SecurityGroup(this, 'ZM-lb-sg', {
      securityGroupName: 'zoneminder load balancer sg',
      vpc
    })

    loadBalancerSecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(443))
    // TODO: forwarding 80 to 443?
    loadBalancerSecurityGroup.addIngressRule(Peer.ipv4('0.0.0.0/0'), Port.tcp(80))
    loadBalancerSecurityGroup.addIngressRule(loadBalancerSecurityGroup, Port.allTraffic())

    // ec2 security group
    const ec2SecurityGroup = new SecurityGroup(this, 'ZM-ec2-sg', {
      securityGroupName: 'zoneminder ec2 instance sg',
      vpc,
    })

    ec2SecurityGroup.addIngressRule(Peer.ipv4(`${process.env.LOCAL_IP}/32` || ''), Port.tcp(22))
    ec2SecurityGroup.addIngressRule(loadBalancerSecurityGroup, Port.tcp(80))

    // ec2 instance
    const ec2Instance = new CfnInstance(this, 'ZM-ec2-instance', {
      // todo: build from ubuntu 16.04? via the zminstall.sh script?
      imageId: process.env.ZONEMINDER_AMI,
      instanceType: 'm5.large',
      availabilityZone: 'us-east-1b',
      // todo: env var
      keyName: process.env.SSH_KEYNAME,
      securityGroupIds: [ec2SecurityGroup.securityGroupId],
      blockDeviceMappings: [{ deviceName: '/dev/sda1', ebs: { deleteOnTermination: false, encrypted: false, volumeSize: 100 }}]
    })

    // ALB
    const loadBalancer = new ApplicationLoadBalancer(this, 'ZM-lb', {
      vpc,
      internetFacing: true,
      securityGroup: loadBalancerSecurityGroup,
    })

    const targetGroup = new ApplicationTargetGroup(this, 'ZM-lb-tg', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.INSTANCE,
      vpc,
      targets: [new InstanceTarget(ec2Instance.ref, 80)]
    })

    new CfnListener(this, 'ZM-http-listener', {
      loadBalancerArn: loadBalancer.loadBalancerArn,
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

    const httpsListener = loadBalancer.addListener('ZM-https-listener', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      sslPolicy: SslPolicy.RECOMMENDED,
      // TODO: generate the cert or use env var?
      certificateArns: [process.env.CERTIFICATE_ARN || '']
    })
    httpsListener.addTargetGroups('ZM-http-listener-tg', { targetGroups: [targetGroup]})

    // Route 53
    new RecordSet(this, 'ZM-rs', {
      // TODO: create hosted zone or use env var?
      zone: HostedZone.fromHostedZoneAttributes(this, 'ZM-hz', {
        hostedZoneId: process.env.HOSTED_ZONE_ID || '',
        zoneName: process.env.HOSTED_ZONE_NAME || ''
      }),
      // TODO: env var?
      recordName: process.env.RECORD_NAME,
      recordType: RecordType.CNAME,
      target: RecordTarget.fromValues(loadBalancer.loadBalancerDnsName)
    })

  }
}

const app = new App()
new ZoneminderStack(app, process.env.STACK_NAME || '', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.AWS_ACCOUNT_NUMBER,
  },
  stackName: process.env.STACK_NAME
});



