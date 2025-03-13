import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

MINIO_ENDPOINT = 'http://localhost:9000'
ACCESS_KEY = 'minio'
SECRET_KEY = 'minio123'

DATA_BUCKET = 'data'
PREFIX = 'embeddings/new/'
LOCAL_DOWNLOAD_FOLDER = './downloads/'

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

def download_files():
    try:
        response = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=PREFIX)
        if 'Contents' not in response:
            print(f'No files found in {DATA_BUCKET}/{PREFIX}')
            return

        os.makedirs(LOCAL_DOWNLOAD_FOLDER, exist_ok=True)

        for obj in response['Contents']:
            file_key = obj['Key']
            local_file_path = os.path.join(LOCAL_DOWNLOAD_FOLDER, os.path.basename(file_key))
            
            try:
                s3_client.download_file(DATA_BUCKET, file_key, local_file_path)
                print(f'Downloaded: {file_key} → {local_file_path}')
            except Exception as e:
                print(f'Error downloading {file_key}: {e}')
    
    except NoCredentialsError:
        print('MinIO credentials not found!')
    except ClientError as e:
        print(f'Error accessing MinIO: {e}')

if __name__ == '__main__':
    download_files()
