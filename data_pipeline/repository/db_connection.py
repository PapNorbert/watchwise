import os
from arango import ArangoClient
from dotenv import load_dotenv

load_dotenv()


def get_db():
    db_name = os.getenv('DB_NAME')
    username = os.getenv('DB_USERNAME')
    password = os.getenv('DB_PASSWD')
    url = os.getenv('DB_URL')
    try:
        client = ArangoClient(hosts=url)
        return client.db(db_name, username=username, password=password)
    except Exception as e:
        print(f"Error connecting to database {db_name}: {e}")
        return None
