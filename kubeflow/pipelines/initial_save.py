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



@dsl.component(packages_to_install=['boto3==1.36.16', 'python-arango==8.1.0'])
def save_movie_series_and_related_inf(url, db_name, username, password, ratings_file_key, movies_collected_file_key, series_collected_file_key):
    from arango import ArangoClient
    import boto3
    import os
    import faker
    import hashlib
    import csv
    import ast
    from datetime import datetime, timezone, timedelta
    import re
    import random
    import uuid

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

    def read_collected_movies(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            movies_collected = []
            genres_collected = set()
            for row in csv_reader:
                # arrays
                row_genres = ast.literal_eval(row[2]) if row[2] else []
                row_ratings = ast.literal_eval(row[13]) if row[13] else []
                row_directors = row[5].split(', ') if row[5] else []
                row_writers = row[6].split(', ') if row[6] else []
                row_actors = row[7].split(', ') if row[7] else []
                row_languages = row[9].split(', ') if row[9] else []

                movies_collected.append({
                    'movieId': row[0],
                    'title': row[1],
                    'genres': row_genres,
                    'imdb_link': row[3],
                    'name': row[4],
                    'directors': row_directors,
                    'writers': row_writers,
                    'actors': row_actors,
                    'plot': row[8],
                    'languages': row_languages,
                    'country_of_origin': row[10],
                    'awards': row[11],
                    'poster': row[12],
                    'ratings': row_ratings,
                })
                genres_collected.update(row_genres) 
            return movies_collected, genres_collected       

    def read_collected_series(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            series_collected = []
            genres_collected = set()
            for row in csv_reader:
                # arrays
                row_genres = [genre.strip() for genre in row[6].split(', ') if genre.strip() and genre.strip() != 'N/A'] if row[6] else []
                ratings_row = ast.literal_eval(row[15]) if row[15] else []
                vote_average = (float(row[1]) / 2) if row[1] else 0.0
                vote_count = int(row[2]) if row[2] else 0
                directors_row = [director.strip() for director in row[7].split(', ') if director.strip() and director.strip() != 'N/A'] if row[7] else []
                writers_row = [writer.strip() for writer in row[8].split(', ') if writer.strip() and writer.strip() != 'N/A'] if row[8] else []
                actors_row = [actor.strip() for actor in row[9].split(', ') if actor.strip() and actor.strip() != 'N/A'] if row[9] else []
                row_languages = [language.strip() for language in row[11].split(', ') if language.strip() and language.strip() != 'N/A'] if row[11] else []

                series_collected.append({
                    'series_id': row[0],
                    'vote_average': vote_average,
                    'vote_count': vote_count,
                    'name': row[3],
                    'year': row[4],
                    'release_date': row[5],
                    'genres': row_genres,
                    'directors': directors_row,
                    'writers': writers_row,
                    'actors': actors_row,
                    'plot': row[10],
                    'languages': row_languages,
                    'country_of_origin': row[12],
                    'awards': row[13],
                    'poster': row[14],
                    'ratings': ratings_row,
                    'imdb_link': row[16],
                    'total_seasons': row[17]
                })
                genres_collected.update(row_genres) 
            return series_collected, genres_collected

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

    def save_genres_to_database(genres):
        try:
            genres_list = []
            genre_ids = {}
            for genre in genres:
                genre_key = string_to_5_digit_number(genre)
                genres_list.append({
                    '_key': genre_key,
                    'name': genre
                })
                genre_ids.update({genre: f'genres/{genre_key}'})
            print('Saving', len(genres_list), 'genres')
            save_many_to_database('genres', genres_list)
            return genre_ids
        except Exception as e:
            print(e)

    def string_to_5_digit_number(s: str) -> str:
        try:
            hash_object = hashlib.md5(s.encode())
            hash_hex = hash_object.hexdigest()
            unique_number = int(hash_hex[:8], 16) % 100000
            return str(unique_number)
        except Exception as e:
            print(e)

    def save_movies_and_ratings_to_database(movies, genre_ids, ratings):
        try:
            movies_for_groups = []
            movie_list = []
            genre_edges = []
            rating_edges, movie_rating_values = create_rating_edges(ratings)
            for movie in movies:
                movie_id = movie['movieId']
                current_movie = {'_key': movie_id}
                set_movie_values(current_movie, movie)
                # set rating values
                if movie_id in movie_rating_values:
                    sum_of_ratings = movie_rating_values[movie_id]['sum_of_ratings']
                    total_ratings = movie_rating_values[movie_id]['total_ratings']
                    average_rating = sum_of_ratings / total_ratings if total_ratings > 0 else 0
                    current_movie.update({
                        'sum_of_ratings': sum_of_ratings,
                        'total_ratings': total_ratings,
                        'average_rating': round(average_rating, 2)
                    })
                    # add movie to create an opinion thread/watchgroup for it
                    if total_ratings > 30:
                        movies_for_groups.append(current_movie)
                else:
                    current_movie.update({
                        'sum_of_ratings': 0,
                        'total_ratings': 0,
                        'average_rating': 0
                    })
                # create genre edges
                if movie['genres']:
                    for genre in movie['genres']:
                        genre_key = genre_ids[genre].split('/')[1]
                        genre_edges.append({
                            '_key': f'33{movie_id}{genre_key}{genre_key}{movie_id}',
                            '_from': f'movies/{movie['movieId']}',
                            '_to': genre_ids[genre]
                        })
                movie_list.append(current_movie)

            # save movies to db
            print('Saving', len(movie_list), 'movies')
            save_many_to_database('movies', movie_list)
            # save the genres of movies
            print('Saving', len(genre_edges), 'his_type edges - genres of movies')
            save_many_to_database('his_type', genre_edges)
            # save ratings of movies
            print('Saving', len(rating_edges), 'rating edges')
            save_many_to_database('has_rated', rating_edges)

            return movies_for_groups
        except Exception as e:
            print(e)

    def extract_year_from_title(title):
        match = re.search(r'\(([^()]+)\)\s*$', title)
        if match:
            return match.group(1)
        return None

    def set_movie_values(current_movie, movie):
        if movie['name'] and movie['name'] != 'N/A':
            current_movie.update({'name': movie['name']})
        if (movie['directors'] and movie['directors'] != 'N/A' and movie['directors'] != ['N/A']
                and movie['directors'] != []):
            current_movie.update({'directors': movie['directors']})
        if (movie['writers'] and movie['writers'] != 'N/A' and movie['writers'] != ['N/A']
                and movie['writers'] != []):
            current_movie.update({'writers': movie['writers']})
        if (movie['actors'] and movie['actors'] != 'N/A' and movie['actors'] != ['N/A']
                and movie['actors'] != []):
            current_movie.update({'actors': movie['actors']})
        movie_year = extract_year_from_title(movie['title'])
        if movie_year:
            current_movie.update({'year': movie_year})
        if (movie['plot'] and movie['plot'] != 'N/A' and movie['plot'] != ['N/A']
                and movie['plot'] != []):
            current_movie.update({'storyline': movie['plot']})
        if (movie['country_of_origin'] and movie['country_of_origin'] != 'N/A' and
                movie['country_of_origin'] != ['N/A'] and movie['country_of_origin'] != []):
            current_movie.update({'country_of_origin': movie['country_of_origin']})
        if (movie['languages'] and movie['languages'] != 'N/A' and movie['languages'] != ['N/A']
                and movie['languages'] != []):
            current_movie.update({'languages': movie['languages']})
        if (movie['awards'] and movie['awards'] != 'N/A' and movie['awards'] != ['N/A']
                and movie['awards'] != []):
            current_movie.update({'awards': movie['awards']})
        if (movie['poster'] and movie['poster'] != 'N/A' and movie['poster'] != ['N/A']
                and movie['poster'] != []):
            current_movie.update({'img_name': movie['poster']})
        if movie['imdb_link'] and movie['imdb_link'] != 'N/A':
            current_movie.update({'imdb_link': movie['imdb_link']})

    def create_rating_edges(ratings):
        rating_edges = []
        movie_rating_values = {}
        for rating in ratings:
            movie_id = rating['movieId']
            rating_edges.append({
                '_key': f'32{rating['userId']}{rating['movieId']}{rating['movieId']}{rating['userId']}',
                '_from': f'users/{rating['userId']}',
                '_to': f'movies/{movie_id}',
                'rating': rating['rating'],
                'date': rating['timestamp']
            })
            if movie_id not in movie_rating_values:
                movie_rating_values[movie_id] = {
                    'sum_of_ratings': 0,
                    'total_ratings': 0
                }
            movie_rating_values[movie_id]['sum_of_ratings'] += rating['rating']
            movie_rating_values[movie_id]['total_ratings'] += 1

        return rating_edges, movie_rating_values

    def save_series_and_ratings_to_database(series, genre_ids, users):
        try:
            series_for_groups = []
            series_list = []
            genre_edges = []
            rating_edges = []
            for serie in series:
                serie_id = serie['series_id']
                current_serie = {'_key': serie_id}
                set_series_values(current_serie, serie)
                # create genre edges
                if serie['genres']:
                    for genre in serie['genres']:
                        genre_key = genre_ids[genre].split('/')[1]
                        genre_edges.append({
                            '_key': f'88{serie_id}{genre_key}{genre_key}{serie_id}',
                            '_from': f'series/{serie_id}',
                            '_to': genre_ids[genre]
                        })
                # create ratings
                vote_count = int(serie['vote_count'] * 0.15)
                current_serie.update({
                    'total_ratings': vote_count,
                    'average_rating': serie['vote_average'],
                    'sum_of_ratings': serie['vote_average'] * vote_count,
                })
                # add serie to create an opinion thread/watchgroup for it
                if vote_count > 100:
                    series_for_groups.append(current_serie)
                if vote_count > 100:
                    vote_count = vote_count % 100 + 93
                rating_users = random.choices(users, k=vote_count)
                for user_id in rating_users:
                    rating_edges.append({
                        # '_key': f'32{user_id}{serie_id}{serie_id}{user_id}',
                        '_from': f'users/{user_id}',
                        '_to': f'series/{serie_id}',
                        'rating': serie['vote_average'],
                        'date': generate_random_date()
                    })
                series_list.append(current_serie)

            # save series to db
            print('Saving', len(series_list), 'series')
            save_many_to_database('series', series_list)
            # save the genres of series
            print('Saving', len(genre_edges), 'his_type edges - genres of series')
            save_many_to_database('his_type', genre_edges)
            # save ratings of series
            print('Saving', len(rating_edges), 'rating edges')
            save_many_to_database('has_rated', rating_edges)

            return series_for_groups
        except Exception as e:
            print(e)

    def generate_random_date(start_year=2010):
        start_date = datetime(start_year, 1, 1)
        end_date = datetime.now()
        random_seconds = random.randint(0, int((end_date - start_date).total_seconds()))
        random_date = start_date + timedelta(seconds=random_seconds)
        return random_date.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    def set_series_values(current_serie, serie):
        if serie['name'] and serie['name'] != 'N/A':
            current_serie.update({'name': serie['name']})
        if (serie['directors'] and serie['directors'] != 'N/A' and serie['directors'] != ['N/A']
                and serie['directors'] != []):
            current_serie.update({'directors': serie['directors']})
        if (serie['writers'] and serie['writers'] != 'N/A' and serie['writers'] != ['N/A']
                and serie['writers'] != []):
            current_serie.update({'writers': serie['writers']})
        if (serie['actors'] and serie['actors'] != 'N/A' and serie['actors'] != ['N/A']
                and serie['actors'] != []):
            current_serie.update({'actors': serie['actors']})
        if serie['release_date'] and serie['release_date'] != 'N/A':
            current_serie.update({'original_release': serie['release_date']})
        if serie['year'] and serie['year'] != 'N/A':
            current_serie.update({'year': serie['year']})
        if serie['total_seasons'] and serie['total_seasons'] != 'N/A':
            current_serie.update({'nr_seasons': serie['total_seasons']})
        if (serie['plot'] and serie['plot'] != 'N/A' and serie['plot'] != ['N/A']
                and serie['plot'] != []):
            current_serie.update({'storyline': serie['plot']})
        if (serie['country_of_origin'] and serie['country_of_origin'] != 'N/A' and
                serie['country_of_origin'] != ['N/A'] and serie['country_of_origin'] != []):
            current_serie.update({'country_of_origin': serie['country_of_origin']})
        if (serie['languages'] and serie['languages'] != 'N/A' and serie['languages'] != ['N/A']
                and serie['languages'] != []):
            current_serie.update({'languages': serie['languages']})
        if (serie['awards'] and serie['awards'] != 'N/A' and serie['awards'] != ['N/A']
                and serie['awards'] != []):
            current_serie.update({'awards': serie['awards']})
        if (serie['poster'] and serie['poster'] != 'N/A' and serie['poster'] != ['N/A']
                and serie['poster'] != []):
            current_serie.update({'img_name': serie['poster']})
        if serie['imdb_link'] and serie['imdb_link'] != 'N/A':
            current_serie.update({'imdb_link': serie['imdb_link']})

    def save_op_threads_and_groups(movies_for_groups, series_for_groups, users):
        current = None
        try:
            op_threads = []
            watch_groups = []
            watch_group_chats = []
            his_group_chats = []
            is_about_show_edges = []
            for movie in movies_for_groups:
                current = movie
                movie_key = movie['_key']
                thread_key = generate_key()
                group_key = generate_key()
                creator_user = random.choice(users)
                creator_user2 = random.choice(users)

                # create opinion threads
                op_threads.append({
                    '_key': thread_key,
                    'title': f'{movie['name']} opinion thread',
                    'creator': creator_user['username'],
                    'show': movie['name'],
                    'description': f'Opinion thread about {movie['name']}',
                    'creation_date': generate_random_date(2023),
                    'show_id': movie_key,
                    'show_type': 'movie',
                    'tags': ['movie', 'spoilers', 'opinions'],
                    'comments': []
                })
                # edge for op thread
                is_about_show_edges.append({
                    '_key': f'{movie_key}73{thread_key}',
                    '_from': f'opinion_threads/{thread_key}',
                    '_to': f'movies/{movie_key}'
                })

                # create watch group
                create_date, watch_date = generate_random_2_dates(2024)
                person_limit = random.randint(4, 16)
                current_nr_persons = random.randint(1, person_limit)
                watch_groups.append({
                    '_key': group_key,
                    'title': f'{movie['name']} watch group',
                    'creator': creator_user2['username'],
                    'show': movie['name'],
                    'description': f'Watch group for {movie['name']}',
                    'watch_date': watch_date,
                    'location': [46.768977, 23.589748],
                    'creation_date': create_date,
                    'show_id': movie_key,
                    'show_type': 'movie',
                    'comments': [],
                    'locationName': 'Parcare de biciclete Piața Unirii, Piața Unirii, Center, Cluj-Napoca, '
                                    'Cluj Metropolitan Area, Kolozs, 400113, Romania',
                    'personLimit': person_limit,
                    'currentNrOfPersons': current_nr_persons
                })
                # create watch group chat
                wg_chat_key = f'{movie_key}9311{group_key}'
                watch_group_chats.append({
                    '_key': wg_chat_key,
                    'chat_comments': []
                })
                # his_group_chat edge for watchgroup
                his_group_chats.append({
                    '_key': f'{movie_key}9312{group_key}',
                    '_from': f'watch_groups/{group_key}',
                    '_to': f'watch_group_chats/{wg_chat_key}'
                })
                # is_about_show_edges edge for watchgroup
                is_about_show_edges.append({
                    '_key': f'{movie_key}93{group_key}',
                    '_from': f'watch_groups/{group_key}',
                    '_to': f'movies/{movie_key}'
                })

            for serie in series_for_groups:
                current = serie
                serie_key = serie['_key']
                thread_key = generate_key()
                group_key = generate_key()
                creator_user = random.choice(users)
                creator_user2 = random.choice(users)

                # create opinion threads
                op_threads.append({
                    '_key': thread_key,
                    'title': f'{serie['name']} opinion thread',
                    'creator': creator_user['username'],
                    'show': serie['name'],
                    'description': f'Opinion thread about {serie['name']}',
                    'creation_date': generate_random_date(2023),
                    'show_id': serie_key,
                    'show_type': 'serie',
                    'tags': ['serie', 'spoilers', 'opinions'],
                    'comments': []
                })
                is_about_show_edges.append({
                    '_key': f'{serie_key}75{thread_key}',
                    '_from': f'opinion_threads/{thread_key}',
                    '_to': f'series/{serie_key}'
                })

                # create watch group
                create_date, watch_date = generate_random_2_dates(2024)
                person_limit = random.randint(4, 16)
                current_nr_persons = random.randint(1, person_limit)
                watch_groups.append({
                    '_key': group_key,
                    'title': f'{serie['name']} watch group',
                    'creator': creator_user2['username'],
                    'show': serie['name'],
                    'description': f'Watch group for {serie['name']}',
                    'watch_date': watch_date,
                    'location': [46.768977, 23.589748],
                    'creation_date': create_date,
                    'show_id': serie_key,
                    'show_type': 'serie',
                    'comments': [],
                    'locationName': 'Parcare de biciclete Piața Unirii, Piața Unirii, Center, Cluj-Napoca, '
                                    'Cluj Metropolitan Area, Kolozs, 400113, Romania',
                    'personLimit': person_limit,
                    'currentNrOfPersons': current_nr_persons
                })
                # create watch group chat
                wg_chat_key = f'{serie_key}9321{group_key}'
                watch_group_chats.append({
                    '_key': wg_chat_key,
                    'chat_comments': []
                })
                # his_group_chat edge for watchgroup
                his_group_chats.append({
                    '_key': f'{serie_key}9322{group_key}',
                    '_from': f'watch_groups/{group_key}',
                    '_to': f'watch_group_chats/{wg_chat_key}'
                })
                # is_about_show_edges edge for watchgroup
                is_about_show_edges.append({
                    '_key': f'{serie_key}95{group_key}',
                    '_from': f'watch_groups/{group_key}',
                    '_to': f'series/{serie_key}'
                })

            print('Saving', len(op_threads), 'opinion threads')
            save_many_to_database('opinion_threads', op_threads)
            print('Saving', len(is_about_show_edges), 'is_about_show edges - threads and groups')
            save_many_to_database('is_about_show', is_about_show_edges)
            print('Saving', len(watch_groups), 'watch groups')
            save_many_to_database('watch_groups', watch_groups)
            print('Saving', len(watch_group_chats), 'watch group chats')
            save_many_to_database('watch_group_chats', watch_group_chats)
            print('Saving', len(his_group_chats), 'his_group_chats edges - threads and groups')
            save_many_to_database('his_group_chat', his_group_chats)

        except Exception as e:
            print(current)
            print(e)

    def generate_random_2_dates(start_year=2010):
        start_date = datetime(start_year, 1, 1)
        end_date = datetime.now()
        random_seconds = random.randint(0, int((end_date - start_date).total_seconds()))
        first_date = start_date + timedelta(seconds=random_seconds)

        min_distance_seconds = 30 * 24 * 60 * 60  # 30 days
        max_distance_seconds = 365 * 24 * 60 * 60  # 1 year

        if max_distance_seconds <= min_distance_seconds:
            # if no valid time span, just add 30 days to the first date
            second_date = first_date + timedelta(seconds=min_distance_seconds)
        else:
            random_additional_seconds = random.randint(min_distance_seconds, max_distance_seconds)
            second_date = first_date + timedelta(seconds=random_additional_seconds)

        first_date_str = first_date.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        second_date_str = second_date.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        return first_date_str, second_date_str

    def generate_key() -> str:
        try:
            unique_id = uuid.uuid4()
            numeric_key = unique_id.int
            return str(numeric_key)
        except Exception as e:
            print(e)


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
    s3_client.download_file(DATA_BUCKET, ratings_file_key, '/tmp/movie_ratings.csv')
    s3_client.download_file(DATA_BUCKET, movies_collected_file_key, '/tmp/movies_collected.csv')
    s3_client.download_file(DATA_BUCKET, series_collected_file_key, '/tmp/series_collected.csv')

    movies_collected, genres_collected_movies_set = read_collected_movies('/tmp/movies_collected.csv')
    ratings, users = read_ratings_and_users('/tmp/movie_ratings.csv')
    user_ids_list = list(users)
    series_collected, genres_collected_series_set = read_collected_series('/tmp/series_collected.csv')
    genres_total = genres_collected_movies_set.union(genres_collected_series_set)
    users_to_save = generate_users(users)

    save_users_to_database(users_to_save)
    genre_ids = save_genres_to_database(genres_total)
    movies_for_groups = save_movies_and_ratings_to_database(movies_collected, genre_ids, ratings)
    series_for_groups = save_series_and_ratings_to_database(series_collected, genre_ids, user_ids_list)
    save_op_threads_and_groups(movies_for_groups, series_for_groups, users_to_save)


@dsl.component(packages_to_install=['boto3==1.36.16', 'python-arango==8.1.0'])
def save_embeddings(url, db_name, username, password, movies_key, series_key):
    from arango import ArangoClient
    import boto3
    import csv
    import ast
    import uuid

    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"
    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"


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

    def read_movie_embeddings(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            movies_w_embeddings = []
            for row in csv_reader:
                row_embedding = ast.literal_eval(row[14]) if row[14] else []
                movies_w_embeddings.append({
                    'movieId': row[0],
                    'name': row[4],
                    'poster': row[12],
                    'embedding': row_embedding,
                })
            return movies_w_embeddings

    def read_serie_embeddings(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            _header = next(csv_reader)
            movies_w_embeddings = []
            for row in csv_reader:
                row_embedding = ast.literal_eval(row[18]) if row[18] else []
                movies_w_embeddings.append({
                    'series_id': row[0],
                    'name': row[3],
                    'poster': row[14],
                    'embedding': row_embedding,
                })
            return movies_w_embeddings

    def save_embeddings_to_database(movie_embeddings, series_embeddings):
        try:
            embeddings = []
            has_embedding_edges = []
            for movie_embedding in movie_embeddings:
                embedding_key = generate_key()
                movie_key = movie_embedding['movieId']
                embeddings.append({
                    '_key': embedding_key,
                    'show_key': movie_key,
                    'show_type': 'movie',
                    'show_name': movie_embedding['name'],
                    **({'img_name': movie_embedding['poster']} if
                    'poster' in movie_embedding and movie_embedding['poster'] != 'N/A' else {}),
                    'embedding_vector': movie_embedding['embedding']
                })
                has_embedding_edges.append({
                    '_key': embedding_key,
                    '_from': f'movies/{movie_key}',
                    '_to': f'embeddings/{embedding_key}'
                })
            for serie_embeddings in series_embeddings:
                embedding_key = generate_key()
                serie_key = serie_embeddings['series_id']
                embeddings.append({
                    '_key': embedding_key,
                    'show_key': serie_key,
                    'show_type': 'serie',
                    'show_name': serie_embeddings['name'],
                    **({'img_name': serie_embeddings['poster']} if
                    'poster' in serie_embeddings and serie_embeddings['poster'] != 'N/A' else {}),
                    'embedding_vector': serie_embeddings['embedding']
                })
                has_embedding_edges.append({
                    '_key': embedding_key,
                    '_from': f'series/{serie_key}',
                    '_to': f'embeddings/{embedding_key}'
                })

            print('Saving', len(embeddings), 'embeddings')
            save_many_to_database('embeddings', embeddings)
            print('Saving', len(has_embedding_edges), 'has embedding edges')
            save_many_to_database('has_embedding', has_embedding_edges)
        except Exception as e:
            print(e)

    def generate_key() -> str:
        try:
            unique_id = uuid.uuid4()
            numeric_key = unique_id.int
            return str(numeric_key)
        except Exception as e:
            print(e)


    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    s3_client.download_file(DATA_BUCKET, movies_key, '/tmp/series_emb.csv')
    s3_client.download_file(DATA_BUCKET, series_key, '/tmp/movies_emb.csv')
    
    movie_embeddings = read_movie_embeddings('/tmp/series_emb.csv')
    serie_embeddings = read_serie_embeddings('/tmp/movies_emb.csv')
    save_embeddings_to_database(movie_embeddings, serie_embeddings)






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

    ratings_file_key = 'initial_save/movie_ratings.csv'
    movies_collected_file_key = 'initial_save/movies_collected_data.csv'
    series_collected_file_key = 'initial_save/series_collected_data.csv'
    users_save_task = save_movie_series_and_related_inf(url, db_name, username, password,
                        movies_collected_file_key, series_collected_file_key, ratings_file_key)
    users_save_task.after(initialize_task)


    movie_emb_key = 'embeddings/initial/movies_w_embedding_st_ext_20_epoch_npgda_data.csv'
    series_emb_key = 'embeddings/initial/series_w_embedding_st_ext_20_epoch_npgda_data.csv'
    save_embeddings_task = save_embeddings(url, db_name, username, password,
                            movie_emb_key, series_emb_key)

    save_embeddings_task.after(initialize_task)



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(initial_save_pipeline, "initial_save_pipeline.yaml")
