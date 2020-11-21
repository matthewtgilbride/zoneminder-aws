import { Construct, Duration, RemovalPolicy } from "@aws-cdk/core";
import { ManagedPolicy, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Bucket } from "@aws-cdk/aws-s3";

interface S3ConstructProps {
  fullyQualifiedDomainName: string
}

export class S3Construct extends Construct {
  public s3Role: Role;

  constructor(scope: Construct, id: string, { fullyQualifiedDomainName }: S3ConstructProps) {
    super(scope, id);

    this.s3Role = new Role(scope, `${id}-S3Role`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(scope, `${id}-S3ManagedPolicy`, 'arn:aws:iam::aws:policy/AmazonS3FullAccess'),
        ManagedPolicy.fromManagedPolicyArn(scope, `${id}-Route53ManagedPolicy`, 'arn:aws:iam::aws:policy/AmazonRoute53FullAccess'),
        ManagedPolicy.fromManagedPolicyArn(scope, `${id}-CloudWatchManagedPolicy`, 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'),
      ],
      roleName: `ZM-${fullyQualifiedDomainName}-role`
    })

    new Bucket(
      scope,
      `${id}-Bucket`,
      {
        bucketName: fullyQualifiedDomainName,
        removalPolicy: RemovalPolicy.DESTROY,
        lifecycleRules: [{
          expiration: Duration.days(14)
        }]
      }
    )
  }
}
