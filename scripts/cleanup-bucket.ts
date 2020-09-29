import { S3, SSM } from "aws-sdk";
import { createInterface } from "readline";

export const cleanupBucket = async () => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const ssm = new SSM()
  const s3 = new S3()
  const domainNameParameter = await ssm.getParameter({ Name: 'domainName' }).promise()
  const domainName = domainNameParameter.Parameter?.Value as string

  rl.question('Bucket prefix (enter text, just enter to skip)? ', async prefix => {

    const bucketName = `zoneminder.${prefix ? `${prefix}.` : ''}${domainName}`;
    const params = { Bucket: bucketName }
    rl.question(
      `Are you SURE you want to delete the contents of ${bucketName}? (y/n): `,
      async answer => {
        if (answer === 'y') {
          await emptyBucket()
        }
        rl.close()
      })

    async function emptyBucket(): Promise<void> {
      const result = await s3.listObjects(params).promise()
      if (result.Contents?.length) {
        await s3.deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: result.Contents
              .map(c => ({ Key: c.Key as string }))
          }
        }).promise()
        return await emptyBucket()
      }
      return Promise.resolve();
    }
  })


}

cleanupBucket()
