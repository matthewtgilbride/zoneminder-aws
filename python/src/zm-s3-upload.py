#!/usr/bin/python3
from boto3 import client
from os import listdir
import sys
import traceback
import logging

objects = ['person', 'bicycle', 'car', 'motorbike', 'bus', 'truck', 'dog', 'cat']


def generate_s3_suffix(description):
    suffix = ''
    if len(description) > 0:
        if description.find('Motion') != -1:
            suffix += '_Motion'
        for object in objects:
            if description.find(object) != -1:
                suffix += f"-{object}"
    return suffix


def generate_s3_path(monitor, date_time):
    split = date_time.split()
    date = split[0]
    time = split[1]
    hours, minutes, seconds = time.split(':')
    return f"{date}/{hours}:{minutes}_{monitor}"


def generate_s3_key(monitor, date_time, description):
    prefix = generate_s3_path(monitor, date_time)
    suffix = generate_s3_suffix(description)
    return f"{prefix}{suffix}.avi"


# unused for now - could possibly use ffmpeg in a lambda instead of forcing ZM zerver to do expensive jpg/avi conversion
def create_video(path, frames, duration):
    frame_rate = round((float(frames) / float(duration)), 2)
    ffmpeg_string = f"ffmpeg -framerate {frame_rate} -pattern_type glob -i '{path}/*capture.jpg' {path}/upload.avi"
    system(ffmpeg_string)


def upload_video(path, monitor, date_time, description):
    s3_client = client('s3')
    files = [f for f in listdir(path) if f.endswith('.avi')]
    if len(files) > 0:
        file_name = f"{path}/{files[0]}"
        bucket = 'zoneminder.mattgilbride.com'
        object_name = generate_s3_key(monitor, date_time, description)
        s3_client.upload_file(file_name, bucket, object_name)
    else:
        logging.error(f"did not find avi file in directory: ${path}")


def upload_raw_zm_files(path, monitor, date_time, description):
    s3_client = client('s3')
    bucket = 'zoneminder.mattgilbride.com'
    s3_path = f"{generate_s3_path(monitor, date_time)}{generate_s3_suffix(description)}"
    for f in listdir(path):
        file_name = f"{path}/{f}"
        object_name = f"{s3_path}/{f}"
        s3_client.upload_file(file_name, bucket, object_name)
    s3_client.put_object(Body=description, Bucket=bucket, Key=f"{s3_path}/-description.txt")


def main(date_time, monitor, description, path):
    logging.basicConfig(filename='/var/log/zm/s3-upload.log', level=logging.INFO)
    logging.info(f"Starting S3 Upload: {path}")
    try:
        # create_video(path, frames, duration)
        upload_raw_zm_files(path, monitor, date_time, description)
        logging.info(f"Finished S3 Upload: {path}")
    except Exception as e:
        track = traceback.format_exc()
        logging.error(track)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
