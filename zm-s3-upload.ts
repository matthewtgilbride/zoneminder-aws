#!/usr/bin/node
import { S3 } from "aws-sdk";
import fs from 'fs';
import { ManagedUpload } from "aws-sdk/lib/s3/managed_upload";
import SendData = ManagedUpload.SendData;

const generateS3Path = (monitor: string, dateTime: string): string => {
  const [date, time] = dateTime.split(' ')
  const [hours, minutes] = time.split(':')
  return `${date}/${hours}:${minutes}_${monitor}`
}

const objects = ['person', 'bicycle', 'car', 'motorbike', 'bus', 'truck', 'dog', 'cat']

const generateS3Suffix = (description: string): string => {
  let suffix = ''
  if (description && description.length) {
    if (description.search('Motion') > -1) {
      suffix += '_Motion'
    }
    objects.forEach(object => {
      if (description.search(object) > -1) {
        suffix += `-${object}`
      }
    })
  }
  return suffix
}

export interface Manifest {
  expected: number;
  received: number;
  converted: boolean;
  description: string;
  path: string;
  frames: string[]
}

const errorHandler = (err: Error) => {
  console.error(`ERROR: ${err.message}`)
}

const successHandler = (data: SendData) => {
  console.log(`COMPLETED: ${data.Key}`)
}

const uploadRawZmFiles = (dateTime: string, monitor: string, description: string, path: string) => {
  const s3 = new S3()
  const files = fs.readdirSync(path)
  const s3Path = `${generateS3Path(monitor, dateTime)}${generateS3Suffix(description)}/`

  let manifest: Manifest = {
    expected: files.length + 1,
    received: 0,
    converted: false,
    description,
    path: s3Path,
    frames: []
  };

  files.forEach(file => {

    const fileBlob = fs.readFileSync(`${path}/${file}`);
    let objectName = `${s3Path}${file}`

    manifest.received += 1;
    if (file.endsWith('capture.jpg')) {
      objectName = `${s3Path}frames/${file}`
      manifest.frames.push(objectName);
    } else if (file.endsWith('analyze.jpg')) {
      objectName = `${s3Path}motion/${file}`
    }

    s3.upload({
      Bucket: 'zoneminder.mattgilbride.com',
      Body: fileBlob,
      Key: objectName
    })
      .promise()
      .then(successHandler)
      .catch(errorHandler)
  })

  manifest.received += 1;

  s3.upload({
    Bucket: 'zoneminder.mattgilbride.com',
    Body: JSON.stringify(manifest, null, 2),
    Key: `${s3Path}-manifest.json`
  })
    .promise()
    .then(successHandler)
    .catch(errorHandler)
}

const main = () => {
  const args = process.argv.slice(2) as [string, string, string, string]
  uploadRawZmFiles(...args)
}

main()
