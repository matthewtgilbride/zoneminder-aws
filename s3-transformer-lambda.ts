import { Context, Handler, S3Event } from "aws-lambda";
import { S3 } from "aws-sdk";
import { Manifest } from "./zm-s3-upload";

const test_event = {
  'Records': [{
    's3': {
      'bucket': {
        'name': 'zoneminder.mattgilbride.com'
      },
      'object': {
        'key': '2020-09-09/15:40_Front/-manifest.json'
      }
    }
  }]
}

// const shell = promisify(exec)

export const handler: Handler<S3Event> = async event => {
  try {
    console.log(`start image fetch: ${new Date().toISOString()}`)
    const s3Client = new S3()
    const [{ s3: { bucket, object: { key}} }] = event.Records

    console.log(key);

    const manifestResult = await s3Client.getObject({ Bucket: bucket.name, Key: key }).promise()
    const manifest = JSON.parse(manifestResult.Body?.toString('utf-8') ?? '') as Manifest

    await Promise.all(manifest.frames.map(Key => {
      return s3Client.getObject({ Bucket: bucket.name, Key }).promise()
    }))

    console.log(`end image fetch: ${new Date().toISOString()}`)


  } catch (e) {
    console.error(e)
  }

}

handler(test_event as unknown as S3Event, {} as Context, () => {});
