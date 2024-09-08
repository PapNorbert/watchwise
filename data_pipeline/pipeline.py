from csv_saver import save_scraped_movies_to_csv
from read_functions import get_movies_with_links_and_genres, read_tags, read_ratings_and_users
from data_generator import generate_user

movies_file_path = './data/movies.csv'
links_file_path = './data/movie_links.csv'
tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'

def load_data_to_database(save_scraped_data_to_file=False):
  movies, genres = get_movies_with_links_and_genres(movies_file_path, links_file_path)
  # tags = read_tags(tags_file_path)
  # ratings, users = read_ratings_and_users(ratings_file_path)

  # scraped_imdb_movies_data = []
  # if save_scraped_data_to_file:
  #   scraped_imdb_movies_data = save_scraped_movies_to_csv(movies)

  # print(scraped_imdb_movies_data[:1])

  # user = generate_user()


if __name__ == "__main__":
  load_data_to_database(save_scraped_data_to_file=True)