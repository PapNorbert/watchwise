import hashlib
from .db_connection import get_db



def save_movies_to_database(movies):
    try:
        save_many_to_database('movies', movies)
    except Exception as e:
        print(e)


def save_tags_to_database(tags):
    try:    
        tags_list = []
        for tag in tags:
            tags_list.append({
                '_key': string_to_5_digit_number(tag),
                'name': tag
            })
        save_many_to_database('tags', tags_list)
    except Exception as e:
        print(e)



def save_users_to_database(users):
    try:
        save_many_to_database('users', users)
    except Exception as e:
        print(e)


def save_genres_to_database(genres):
    try:
        genres_list = []
        for genre in genres:
            genres_list.append({
                '_key': string_to_5_digit_number(genre),
                'name': genre
            })
        save_many_to_database('genres', genres_list)
    except Exception as e:
        print(e)


def string_to_5_digit_number(s: str) -> str:
    hash_object = hashlib.md5(s.encode())
    hash_hex = hash_object.hexdigest()
    unique_number = int(hash_hex[:8], 16) % 100000
    return str(unique_number)


# Saves documents to the database
# If the document exists, they are updated
def save_many_to_database(collection_name, data):
    try:
        db = get_db()
        collection = db.collection(collection_name)
        result = collection.insert_many(data, overwrite=True, overwrite_mode='update')
        return result
    except Exception as e:
        print(e)
        return []
