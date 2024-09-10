import csv
from datetime import datetime, timezone
import ast


def read_movies_and_genres(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        movies = []
        genres = set()
        for row in csv_reader:
            # only keep movies with genres
            if row[2] == '(no genres listed)':
                continue
            row_genres = [genre for genre in row[2].split('|') if genre != 'IMAX'] if row[2] else []
            movies.append({
                'movieId': row[0],
                'title': row[1],
                'genres': row_genres
            })
            genres.update(row_genres)
        return movies, list(genres)


def read_links(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        links = {}
        for row in csv_reader:
            links[row[0]] = f'https://www.imdb.com/title/tt{row[1]}/'
        return links


def read_tags(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        tags = set()
        for row in csv_reader:
            tags.add(row[2])
        return tags


def get_movies_with_links_and_genres(movies_file_path, links_file_path):
    # merge movies with links
    movies, genres = read_movies_and_genres(movies_file_path)
    links = read_links(links_file_path)

    movies_with_links = []
    for movie in movies:
        movie_id = movie['movieId']
        if movie_id in links:
            movie['imdb_link'] = links[movie_id]
        movies_with_links.append(movie)

    return movies_with_links, genres


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


def read_tv_series(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        tv_series = []
        for row in csv_reader:
            if row[6]:
                formatted_date = ''
                if row[3]:
                    date_obj = datetime.strptime(row[3], "%Y-%m-%d")
                    formatted_date = date_obj.strftime('%B %d, %Y')
                tv_series.append({
                    'series_id': row[1],
                    'title': row[2],
                    'release_date': formatted_date,
                    'country_of_origin': row[4],
                    'original_language': row[5],
                    'overview': row[6],
                })
        return tv_series


def read_collected_movies(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        movies_collected = []
        genres_collected = set()
        for row in csv_reader:
            row_genres = ast.literal_eval(row[2]) if row[2] else []
            row_ratings = ast.literal_eval(row[13]) if row[13] else []

            movies_collected.append({
                'movieId': row[0],
                'title': row[1],
                'genres': row_genres,
                'imdb_link': row[3],
                'name': row[4],
                'director': row[5],
                'writer': row[6],
                'actors': row[7],
                'plot': row[8],
                'language': row[9],
                'country_of_origin': row[10],
                'awards': row[11],
                'poster': row[12],
                'ratings': row_ratings,
            })
            genres_collected.update(row_genres) 
        return movies_collected, genres_collected