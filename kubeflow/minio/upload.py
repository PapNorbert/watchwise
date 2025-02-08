import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

MINIO_ENDPOINT = 'http://localhost:9000'
ACCESS_KEY = 'minio'
SECRET_KEY = 'minio123'


DATA_FOLDER = 'data'
MODEL_FOLDER = 'model'
ZIP_FILE = 'watchwise-recom-model-20-epoch.zip'

DATA_BUCKET = 'data'
MODEL_BUCKET = 'models'


s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)


def create_bucket(bucket_name):
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f'Using existing {bucket_name} bucket.')
    except ClientError:
        try:
            s3_client.create_bucket(Bucket=bucket_name)
            print(f'Bucket {bucket_name} created successfully.')
        except Exception as e:
            print(f'Error creating bucket {bucket_name}: {e}')


def upload_data_files():
    if not os.path.exists(DATA_FOLDER):
        print(f'Data folder {DATA_FOLDER} not found!')
        return
    create_bucket(DATA_BUCKET)
    for root, _, files in os.walk(DATA_FOLDER):
        for file in files:
            file_path = os.path.join(root, file)
            minio_path = os.path.relpath(file_path, DATA_FOLDER).replace("\\", "/")
            try:
                s3_client.upload_file(file_path, DATA_BUCKET, minio_path)
                print(f'Uploaded: {file_path} → {DATA_BUCKET}/{minio_path}')
            except NoCredentialsError:
                print('MinIO credentials not found!')
                return


def upload_model():
    if not os.path.exists(MODEL_FOLDER):
        print(f'Model folder {MODEL_FOLDER} not found!')
        return
    create_bucket(MODEL_BUCKET)
    zip_name = f'{MODEL_FOLDER}/{ZIP_FILE}'
    try:
        s3_client.upload_file(zip_name, MODEL_BUCKET, ZIP_FILE)
        print(f'Uploaded: {zip_name} → {MODEL_BUCKET}/{ZIP_FILE}')
    except NoCredentialsError:
        print('MinIO credentials not found!')


if __name__ == '__main__':
    upload_data_files()
    upload_model()
