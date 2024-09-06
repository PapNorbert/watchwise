import csv
from datetime import datetime, timezone

movies_file_path = './data/movies.csv'
links_file_path = './data/movie_links.csv'
tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'

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


def get_movies_with_links_and_genres():
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

