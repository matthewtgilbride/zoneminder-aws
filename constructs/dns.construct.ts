import { Construct, Duration } from "@aws-cdk/core";
import { HostedZone, RecordSet, RecordTarget, RecordType } from "@aws-cdk/aws-route53";
import { Instance } from "@aws-cdk/aws-ec2";

export interface DnsConstructProps {
  instance: Instance
  localIp: string,
  domainName: string,
  domainPrefix?: string,
}

export class DnsConstruct extends Construct {

  constructor(scope: Construct, id: string, { instance, localIp, domainName, domainPrefix }: DnsConstructProps) {
    super(scope, id);


    const zone = HostedZone.fromLookup(this, `${id}-HostedZone`, {
      domainName,
    })

    const dn = domainPrefix ? `${domainPrefix}.${domainName}` : domainName

    new RecordSet(this, 'ZM-rs', {
      zone,
      recordName: `zoneminder.${dn}`,
      recordType: RecordType.CNAME,
      // todo: make longer once stable
      ttl: Duration.seconds(60),
      target: RecordTarget.fromValues(instance.instancePublicDnsName)
    })

    // cameras to local IP
    new RecordSet(this, 'ZM-rs-cameras', {
      zone,
      recordName: `camera.zoneminder.${dn}`,
      recordType: RecordType.CNAME,
      // todo: make longer once stable
      ttl: Duration.seconds(60),
      target: RecordTarget.fromIpAddresses(localIp)
    })
  }

}
