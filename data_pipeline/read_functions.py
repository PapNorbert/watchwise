import csv
import random

movies_file_path = './data/movies.csv'
links_file_path = './data/movie_links.csv'
tags_file_path = './data/movie_tags.csv'


def read_movies(file_path):
    with open(file_path, mode='r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        movies = []
        for row in csv_reader:
            # only keep movies with genres
            if row[2] == '(no genres listed)':
                continue
            movies.append({
                'movieId': row[0],
                'title': row[1],
                'genres': row[2].split('|') if row[2] else []
            })
        
        return movies


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


def get_movies_with_links():
    # merge movies with links
    movies = read_movies(movies_file_path)
    links = read_links(links_file_path)

    movies_with_links = []
    for movie in movies:
        movie_id = movie['movieId']
        if movie_id in links:
            movie['imdb_link'] = links[movie_id]
        movies_with_links.append(movie)

    return movies_with_links

