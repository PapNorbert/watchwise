import random
from read_functions import get_movies_with_links_and_genres, read_tags, read_ratings_and_users


movies_file_path = './data/movies.csv'
links_file_path = './data/movie_links.csv'
tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'

def load_data_to_database():
  movies, genres = get_movies_with_links_and_genres(movies_file_path, links_file_path)
  # tags = read_tags(tags_file_path)
  # ratings, users = read_ratings_and_users(ratings_file_path)
  print(random.choice(movies))



load_data_to_database()