import random
from omdb_show_date_requester import get_show_details_by_title
from read_functions import get_movies_with_links_and_genres, read_tags, read_ratings_and_users, read_tv_series, read_collected_movies
from data_generator import generate_user

movies_file_path = './data/movies.csv'
links_file_path = './data/movie_links.csv'
tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'
series_file_path = './data/tv_series.csv'

collected_movies_file_path = './data/movies_collected_data.csv'

def load_data_to_database():
  # movies, genres = get_movies_with_links_and_genres(movies_file_path, links_file_path)

  # tags = read_tags(tags_file_path)
  # ratings, users = read_ratings_and_users(ratings_file_path)
  series = read_tv_series(series_file_path)

  
  # user = generate_user()

  # movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)



if __name__ == "__main__":
  load_data_to_database()