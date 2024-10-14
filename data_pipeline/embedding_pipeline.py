from embedding.embedding_creator import create_embeddings_for_movies_nomic, create_embeddings_for_series_nomic
from util.csv_saver import save_movies_with_embedding_to_csv, save_series_with_embedding_to_csv
from util.read_functions import read_ratings_and_users, read_collected_movies, read_collected_series


ratings_file_path = './data/movie_ratings.csv'
collected_movies_file_path = './data/movies_collected_data.csv'
collected_series_file_path = './data/series_collected_data.csv'


def create_embeddings():
    # movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)
    # ratings, users = read_ratings_and_users(ratings_file_path)
    series_collected, genres_collected_series_set = read_collected_series(collected_series_file_path)
    # genres_total = genres_collected_movies_set.union(genres_collected_series_set)

    # # movie embeddings
    # movies_with_embeddings = create_embeddings_for_movies_nomic(
    #     movies=movies_collected, fields_to_use=['plot', 'genres']
    # )
    # save_movies_with_embedding_to_csv(movies_with_embeddings, './data/movies_w_embedding_pg_data.csv')

    series_with_embeddings = create_embeddings_for_series_nomic(
        series=series_collected, fields_to_use=['plot', 'genres', 'directors', 'actors']
    )
    save_series_with_embedding_to_csv(series_with_embeddings, './data/series_w_embedding_pgda_data.csv')


if __name__ == "__main__":
    create_embeddings()
