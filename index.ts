import { App, Stack, StackProps } from '@aws-cdk/core';
import { ZoneminderConstruct } from "./constructs/zoneminder.construct";


class ZoneminderStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    new ZoneminderConstruct(this, 'zoneminder', {
      localIp: process.env.LOCAL_IP as string,
      amiImageId: 'ami-0632c45200ed0fce6',
      sshKeyName: 'zoneminder-ami',
      ebsVolumeSize: 100
    })
  }
}

const app = new App()
new ZoneminderStack(app, 'zoneminder', {
  env: {
    region: process.env.AWS_DEFAULT_REGION,
    account: process.env.AWS_ACCOUNT_NUMBER,
  },
});



