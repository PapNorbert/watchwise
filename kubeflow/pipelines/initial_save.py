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
def save_tags(url, db_name, username, password, file_key):
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
        s3_client.download_file(DATA_BUCKET, file_key, '/tmp/movie_tags.csv')
        tags = read_tags('/tmp/movie_tags.csv')
        save_tags_to_database(tags)

    except Exception as e:
        print(e)
        return False


@dsl.component(packages_to_install=['boto3==1.36.16', 'python-arango==8.1.0', 'faker==28.4.1'])
def save_users(url, db_name, username, password, file_key):
    from arango import ArangoClient
    import boto3
    import os
    import faker
    import hashlib
    import csv
    from datetime import datetime, timezone

    fake = faker.Faker()
    user_role_code = 15489


    def read_ratings_and_users(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            ratings = []
            users = set()
            for row in csv_reader:
                timestamp = datetime.fromtimestamp(int(row[3]), tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
                ratings.append({
                    'userId': row[0],
                    'movieId': row[1],
                    'rating': float(row[2]),
                    'timestamp': timestamp
                })
                users.add(row[0])
            return ratings, users
        
    def generate_users(users):
        users_list = []
        for user in users:
            current_user = generate_user(user)
            users_list.append(current_user)
        return users_list

    def generate_user(user):
        first_name = fake.first_name()
        last_name = fake.last_name()
        return {
            '_key': user,
            'first_name': first_name,
            'last_name': last_name,
            'username': first_name.lower() + last_name.lower(),
            'role': user_role_code,
            'about_me': fake.text(80),
            'create_date': fake.date_time_this_century().isoformat(),
            'password': hash_password()
        }
    
    def hash_password():
        random_bytes = os.urandom(16)
        return hashlib.sha256(random_bytes).hexdigest()

    def save_users_to_database(users):
        try:
            print('Saving', len(users), 'users')
            save_many_to_database('users', users)
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


    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"
    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"

    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    s3_client.download_file(DATA_BUCKET, file_key, '/tmp/movie_ratings.csv')
    ratings, users = read_ratings_and_users('/tmp/movie_ratings.csv')
    users_to_save = generate_users(users)
    save_users_to_database(users_to_save)



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

    tags_file_key = 'initial_save/movie_tags.csv'
    save_tags_task = save_tags(url, db_name, username, password, tags_file_key)
    save_tags_task.after(initialize_task)

    users_file_key = 'initial_save/movie_ratings.csv'
    users_save_task = save_users(url, db_name, username, password, users_file_key)
    users_save_task.after(initialize_task)




# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(initial_save_pipeline, "initial_save_pipeline.yaml")
