import { StringParameter } from "@aws-cdk/aws-ssm";
import { Secret } from "@aws-cdk/aws-secretsmanager";
import { AccountPrincipal } from "@aws-cdk/aws-iam";
import { Construct } from "@aws-cdk/core";

export interface ParameterSecretProps {
  zmUser: string, domainName: string
}

export class ParameterSecretConstruct extends Construct {
  constructor(scope: Construct, id: string, { zmUser, domainName }: ParameterSecretProps) {
    super(scope, id)
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
  }
}
