import hashlib
import random
import re
import uuid
from datetime import datetime, timedelta
from .db_connection import get_db


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
            vote_count = serie['vote_count']
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


def save_users_to_database(users):
    try:
        print('Saving', len(users), 'users')
        save_many_to_database('users', users)
    except Exception as e:
        print(e)


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


def generate_key() -> str:
    try:
        unique_id = uuid.uuid4()
        numeric_key = unique_id.int
        return str(numeric_key)
    except Exception as e:
        print(e)


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
