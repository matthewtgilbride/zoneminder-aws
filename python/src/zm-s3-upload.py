from boto3 import client
import sys
import traceback
import logging


def generate_s3_key(monitor, date_time, description):
    split = date_time.split()
    date = split[0]
    time = split[1]
    description = description.replace(' ', '')
    replace_chars_with_dash = [':','[',']', '%']
    for char in replace_chars_with_dash:
        description = description.replace(char, "-")
    if len(description) > 0:
        description = '_' + description
    return f"{date}/{monitor}/{time.replace(':','.')}{description}.avi"


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


def main(date_time, duration, frames, monitor, description, path):
    logging.basicConfig(filename='/var/log/zm/s3-upload.log', level=logging.INFO)
    logging.info(f"Starting S3 Upload: {path}")
    try:
        # create_video(path, frames, duration)
        upload_video(path, monitor, date_time, description)
        logging.info(f"Finished S3 Upload: {path}")
    except Exception as e:
        track = traceback.format_exc()
        logging.error(track)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
