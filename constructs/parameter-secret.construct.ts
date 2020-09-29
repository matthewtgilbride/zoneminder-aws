import { StringParameter } from "@aws-cdk/aws-ssm";
import { Secret } from "@aws-cdk/aws-secretsmanager";
import { AccountPrincipal } from "@aws-cdk/aws-iam";
import { Construct } from "@aws-cdk/core";

export interface ParameterSecretProps {
  zmUser: string, domainName: string, stackName: string
}

export class ParameterSecretConstruct extends Construct {
  constructor(scope: Construct, id: string, { zmUser, domainName, stackName }: ParameterSecretProps) {
    super(scope, id)
    new StringParameter(this, 'zmUser', {
      parameterName: `${stackName}User`,
      stringValue: zmUser
    })
    new StringParameter(this, 'zmApiUrl', {
      parameterName: `${stackName}ApiUrl`,
      stringValue: `https://${stackName}.${domainName}/zm/api`
    })

    const secret = new Secret(this, 'zmPassword', {
      secretName: `${stackName}Password`,
      generateSecretString: {
        excludePunctuation: true
      }
    })
    secret.grantRead({ grantPrincipal: new AccountPrincipal(process.env.AWS_ACCOUNT_NUMBER as string)})
  }
}
