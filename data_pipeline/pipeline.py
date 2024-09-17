import random
from util.read_functions import read_tags, read_ratings_and_users, read_collected_movies, read_collected_series
from util.data_generator import generate_users
from repository.db_saver import save_tags_to_database, save_users_to_database, save_genres_to_database


tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'
collected_movies_file_path = './data/movies_collected_data.csv'
collected_series_file_path = './data/series_collected_data.csv'

def load_data_to_database():
    movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)
    tags = read_tags(tags_file_path)
    ratings, users = read_ratings_and_users(ratings_file_path)
    series_collected, genres_collected_series_set = read_collected_series(collected_series_file_path)
    genres_total = genres_collected_movies_set.union(genres_collected_series_set)

    # users_to_save = generate_users(users)
    # save_tags_to_database(tags)
    # save_users_to_database(users_to_save)
    # save_genres_to_database(genres_total)
    save_movies_to_database(movies_collected)



if __name__ == "__main__":
    load_data_to_database()