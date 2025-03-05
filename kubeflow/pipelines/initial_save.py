# pyright: reportInvalidTypeForm=false

import kfp
from kfp import dsl



@dsl.component(packages_to_install=['python-arango==8.1.0'])
def initialize_collections(url, db_name, username, password):
    from arango import ArangoClient

    try:
        client = ArangoClient(hosts=url, request_timeout=240)
        db = client.db(db_name, username=username, password=password)
        collections = [
            'movies', 'series', 'users', 'watch_groups',
            'genres', 'opinion_threads', 'moderator_requests',
            'watch_group_chats', 'tags', 'announcements', 'embeddings'
        ]
        edge_collections = [
            'joined_group', 'his_group_chat', 'join_request',
            'follows_thread', 'his_type', 'is_about_show',
            'has_rated', 'has_embedding'
        ]
        for collection_name in collections:
            try:
                if not db.has_collection(collection_name):
                    db.create_collection(collection_name)
            except Exception as e:
                print(f"Error creating collection {collection_name}: {e}")

        for edge_collection_name in edge_collections:
            try:
                if not db.has_collection(edge_collection_name):
                    db.create_collection(edge_collection_name, edge=True)
            except Exception as e:
                print(f"Error creating edge collection {edge_collection_name}: {e}")
        return True
    except Exception as e:
        print(e)
        return False


@dsl.component(packages_to_install=['boto3==1.36.16', 'python-arango==8.1.0'])
def save_tags(url, db_name, username, password):
    from arango import ArangoClient
    import boto3
    import csv
    import hashlib

    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"
    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"

    def read_tags(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            tags = set()
            for row in csv_reader:
                tags.add(row[2])
            tags.add('spoilers')
            tags.add('no spoilers')
            tags.add('movie')
            tags.add('serie')
            tags.add('opinions')
            return tags
    
    def save_tags_to_database(tags):
        try:
            tags_list = []
            for tag in tags:
                tags_list.append({
                    '_key': string_to_5_digit_number(tag),
                    'name': tag
                })
            print('Saving', len(tags_list), 'tags')
            save_many_to_database('tags', tags_list)
        except Exception as e:
            print(e)

    def save_many_to_database(collection_name, data):
        try:
            client = ArangoClient(hosts=url, request_timeout=240)
            db = client.db(db_name, username=username, password=password)
            collection = db.collection(collection_name)
            result = collection.insert_many(data, overwrite=True, overwrite_mode='update')
            return result
        except Exception as e:
            print(e)
            return []
        
    def string_to_5_digit_number(s: str) -> str:
        try:
            hash_object = hashlib.md5(s.encode())
            hash_hex = hash_object.hexdigest()
            unique_number = int(hash_hex[:8], 16) % 100000
            return str(unique_number)
        except Exception as e:
            print(e)


    try:
        s3_client = boto3.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY
        )
        file_key = 'initial_save/movie_tags.csv'
        s3_client.download_file(DATA_BUCKET, file_key, '/tmp/movie_tags.csv')
        tags = read_tags('/tmp/movie_tags.csv')
        save_tags_to_database(tags)

    except Exception as e:
        print(e)
        return False



@dsl.pipeline(
    name="New Show Data Processing Pipeline",
    description="A pipeline for downloading, creating embeddings, and cleaning up new show data"
)
def initial_save_pipeline():
    url = ''
    password=''
    username='root'
    db_name='watchwiseRecommend'

    initialize_task = initialize_collections(url, db_name, username, password)

    save_tags_taks = save_tags(url, db_name, username, password)
    save_tags_taks.after(initialize_task)



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(initial_save_pipeline, "initial_save_pipeline.yaml")
