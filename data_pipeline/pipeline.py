import random
from read_functions import read_tags, read_ratings_and_users, read_collected_movies, read_collected_series
from data_generator import generate_user

tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'

collected_movies_file_path = './data/movies_collected_data.csv'
collected_series_file_path = './data/series_collected_data.csv'

def load_data_to_database():
  movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)
  # tags = read_tags(tags_file_path)
  # ratings, users = read_ratings_and_users(ratings_file_path)
  series_collected, genres_collected_series_set = read_collected_series(collected_series_file_path)
  genres_total = genres_collected_movies_set.union(genres_collected_series_set)

  # user = generate_user()





if __name__ == "__main__":
  load_data_to_database()