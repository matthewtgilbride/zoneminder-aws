import { Construct, Duration } from "@aws-cdk/core";
import { HostedZone, RecordSet, RecordTarget, RecordType } from "@aws-cdk/aws-route53";
import { Instance } from "@aws-cdk/aws-ec2";

export interface DnsConstructProps {
  instance: Instance
  localIp: string,
  domainName: string,
}

export class DnsConstruct extends Construct {

  constructor(scope: Construct, id: string, { instance, localIp, domainName }: DnsConstructProps) {
    super(scope, id);


    const zone = HostedZone.fromLookup(this, `${id}-HostedZone`, {
      domainName,
    })

    new RecordSet(this, 'ZM-rs', {
      zone,
      recordName: `zoneminder.${domainName}`,
      recordType: RecordType.CNAME,
      // todo: make longer once stable
      ttl: Duration.seconds(60),
      target: RecordTarget.fromValues(instance.instancePublicDnsName)
    })

    // cameras to local IP
    new RecordSet(this, 'ZM-rs-cameras', {
      zone,
      recordName: `camera.zoneminder.${domainName}`,
      recordType: RecordType.CNAME,
      // todo: make longer once stable
      ttl: Duration.seconds(60),
      target: RecordTarget.fromIpAddresses(localIp)
    })
  }

}
