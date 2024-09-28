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
        tags.add('spoilers')
        tags.add('no spoilers')
        tags.add('movie')
        tags.add('serie')
        tags.add('opinions')
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
                    'vote_average': row[8],
                    'vote_count': row[9],
                })
        return tv_series


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
