#!/usr/bin/node
import { S3 } from "aws-sdk";
import fs from 'fs';

const generateS3Path = (monitor: string, dateTime: string): string => {
  const [date, time] = dateTime.split(' ')
  const [hours, minutes] = time.split(':')
  return `${date}/${hours}:${minutes}_${monitor}`
}

const errorHandler = (err: Error) => console.error(err.message)
const successHandler = () => console.log(`upload: ${Date.now()}`)

const uploadRawZmFiles = (dateTime: string, monitor: string, description: string, path: string) => {
  console.log(`start: ${Date.now()}`);
  const s3 = new S3()
  const files = fs.readdirSync(path)
  files.forEach(file => {
    const fileBlob = fs.readFileSync(`${path}/${file}`);
    const objectName = `${generateS3Path(monitor, dateTime)}/${file}`
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
    Key: `${generateS3Path(monitor, dateTime)}/-description.txt`
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
