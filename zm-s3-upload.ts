#!/usr/bin/node
import { S3 } from "aws-sdk";
import fs from 'fs';

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

const errorHandler = (err: Error) => console.error(err.message)
const successHandler = () => console.log(`upload: ${Date.now()}`)

const uploadRawZmFiles = (dateTime: string, monitor: string, description: string, path: string) => {
  console.log(`start: ${Date.now()}`);
  const s3 = new S3()
  const files = fs.readdirSync(path)
  const s3Folder = `${generateS3Path(monitor, dateTime)}${generateS3Suffix(description)}`
  files.forEach(file => {
    const fileBlob = fs.readFileSync(`${path}/${file}`);
    const objectName = `${s3Folder}/${file}`
    s3.upload({
      Bucket: 'zoneminder.mattgilbride.com',
      Body: fileBlob,
      Key: objectName
    })
      .promise()
      .then(successHandler)
      .catch(errorHandler)
  })
  s3.upload({
    Bucket: 'zoneminder.mattgilbride.com',
    Body: description,
    Key: `${s3Folder}/-description.txt`
  })
    .promise()
    .catch(errorHandler)
    .then(successHandler)
}

const main = () => {
  const args = process.argv.slice(2) as [string, string, string, string]
  uploadRawZmFiles(...args)
}

main()
