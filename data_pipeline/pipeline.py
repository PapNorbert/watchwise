from util.read_functions import read_tags, read_ratings_and_users, read_collected_movies, read_collected_series
from util.data_generator import generate_users
from repository.db_setup import initialize_collections
from repository.db_saver import save_tags_to_database, save_users_to_database, save_genres_to_database, \
    save_movies_and_ratings_to_database, \
    save_series_and_ratings_to_database

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
    users_to_save = generate_users(users)

    initialize_collections()

    save_tags_to_database(tags)
    save_users_to_database(users_to_save)
    genre_ids = save_genres_to_database(genres_total)
    save_movies_and_ratings_to_database(movies_collected, genre_ids, ratings)
    # new rating edges will be generated for series because of random users !!!
    save_series_and_ratings_to_database(series_collected, genre_ids, list(users))


if __name__ == "__main__":
    load_data_to_database()
