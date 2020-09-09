import cv2
import json
import numpy as np
from boto3 import client
from urllib.parse import unquote_plus
from datetime import datetime


test_event = {
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


def lambda_handler(event, context):
    print(f"start: {datetime.now()}")
    s3 = client('s3')
    size = None
    out = None
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        manifest = json.loads(s3.get_object(
            Bucket=bucket,
            Key=key
        )['Body'].read().decode('utf-8'))
        capture_keys = manifest['captureKeys']

        for capture_key in capture_keys:
            raw = s3.get_object(
                Bucket=bucket,
                Key=capture_key
            )['Body'].read()

            # https://intellipaat.com/community/15647/python-opencv-load-image-from-byte-string
            nparr = np.frombuffer(raw, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            height, width, _ = img_np.shape

            # https://theailearner.com/2018/10/15/creating-video-from-images-using-opencv-python/
            if not size:
                size = (width, height)
            if not out:
                out = cv2.VideoWriter('test.avi', cv2.VideoWriter_fourcc(*'DIVX'), 8.33, size)

            out.write(img_np)
            print(capture_key)

    out.release()
    print(f"end: {datetime.now()}")


def save_images(event):
    print(f"start: {datetime.now()}")
    s3 = client('s3')
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = unquote_plus(record['s3']['object']['key'])
        manifest = json.loads(s3.get_object(
            Bucket=bucket,
            Key=key
        )['Body'].read().decode('utf-8'))
        capture_keys = manifest['captureKeys']

        for capture_key in capture_keys:
            raw = s3.get_object(
                Bucket=bucket,
                Key=capture_key
            )['Body'].read()

            file_name = capture_key[capture_key.rindex('/'):len(capture_key)]

            f = open(f"/Users/mtg/dev/zoneminder-aws/python/scripts/{file_name}", 'wb')
            f.write(raw)
            f.close()

            print(capture_key)


    print(f"end: {datetime.now()}")

save_images(test_event)
# lambda_handler(test_event, {})
