import { Construct } from "@aws-cdk/core";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  CfnListener,
  InstanceTarget,
  SslPolicy,
  TargetType
} from "@aws-cdk/aws-elasticloadbalancingv2";
import { Instance, IVpc, SecurityGroup } from "@aws-cdk/aws-ec2";
import { StringParameter } from "@aws-cdk/aws-ssm";

export interface AlbConstructProps {
  vpc: IVpc,
  loadBalancerSecurityGroup: SecurityGroup,
  ec2Instance: Instance,
}

export class AlbConstruct extends Construct {
  public alb: ApplicationLoadBalancer

  constructor(scope: Construct, id: string, { vpc, loadBalancerSecurityGroup, ec2Instance }: AlbConstructProps) {
    super(scope, id);
    this.alb = new ApplicationLoadBalancer(this, 'ZM-lb', {
      vpc,
      internetFacing: true,
      securityGroup: loadBalancerSecurityGroup,
    })

    // redirect HTTP to HTTPS
    new CfnListener(this, 'ZM-http-listener', {
      loadBalancerArn: this.alb.loadBalancerArn,
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
      targets: [new InstanceTarget(ec2Instance.instanceId, 80)]
    })

    const certificateArn = StringParameter.valueFromLookup(this, 'certificateArn');

    const httpsListener = this.alb.addListener('ZM-https-listener', {
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
      targets: [new InstanceTarget(ec2Instance.instanceId, 9000)]
    })

    const wsListener = this.alb.addListener('ZM-ws-listener', {
      port: 9000,
      protocol: ApplicationProtocol.HTTPS,
      sslPolicy: SslPolicy.RECOMMENDED,
      certificateArns: [certificateArn]
    })
    wsListener.addTargetGroups('ZM-ws-listener-tg', { targetGroups: [wsTargetGroup]})

  }
}
