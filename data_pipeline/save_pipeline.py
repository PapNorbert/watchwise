from util.read_functions import read_tags, read_ratings_and_users, read_collected_movies, read_collected_series, \
    read_movie_embeddings, read_serie_embeddings
from util.data_generator import generate_users
from repository.db_setup import initialize_collections
from repository.db_saver import save_tags_to_database, save_users_to_database, save_genres_to_database, \
    save_movies_and_ratings_to_database, save_series_and_ratings_to_database, save_op_threads_and_groups, \
    save_embeddings_to_database

tags_file_path = './data/movie_tags.csv'
ratings_file_path = './data/movie_ratings.csv'
collected_movies_file_path = './data/movies_collected_data.csv'
collected_series_file_path = './data/series_collected_data.csv'

# movie_embeddings_file_path = './data/movies_w_embedding_pgda_data.csv'
movie_embeddings_file_path = './data/movies_w_embedding_pg_data.csv'
series_embeddings_file_path = './data/series_w_embedding_pg_data.csv'


def load_data_to_database():
    movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)
    tags = read_tags(tags_file_path)
    ratings, users = read_ratings_and_users(ratings_file_path)
    user_ids_list = list(users)
    series_collected, genres_collected_series_set = read_collected_series(collected_series_file_path)
    genres_total = genres_collected_movies_set.union(genres_collected_series_set)
    users_to_save = generate_users(users)
    movie_embeddings = read_movie_embeddings(movie_embeddings_file_path)
    serie_embeddings = read_serie_embeddings(series_embeddings_file_path)

    initialize_collections()
    # some new documents will be generated !!!
    # for example new series rating edges because of random users
    save_tags_to_database(tags)
    save_users_to_database(users_to_save)
    genre_ids = save_genres_to_database(genres_total)
    movies_for_groups = save_movies_and_ratings_to_database(movies_collected, genre_ids, ratings)
    series_for_groups = save_series_and_ratings_to_database(series_collected, genre_ids, user_ids_list)
    save_op_threads_and_groups(movies_for_groups, series_for_groups, users_to_save)
    save_embeddings_to_database(movie_embeddings, serie_embeddings)


if __name__ == "__main__":
    load_data_to_database()
