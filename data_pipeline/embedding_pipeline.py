from embedding.embedding_creator import (create_embeddings_for_movies_nomic, create_embeddings_for_series_nomic,
                                         create_embeddings_word2vec, create_embeddings_sentence_transformer)
from util.csv_saver import save_movies_with_embedding_to_csv, save_series_with_embedding_to_csv
from util.read_functions import read_ratings_and_users, read_collected_movies, read_collected_series
from util.train_data import create_train_data, read_train_data


ratings_file_path = './data/movie_ratings.csv'
collected_movies_file_path = './data/movies_collected_data.csv'
collected_series_file_path = './data/series_collected_data.csv'

train_data_file = './data/raw_train_data.json'
train_data_file_ext = './data/raw_train_data_ext.json'


def create_embeddings():
    movies_collected, genres_collected_movies_set = read_collected_movies(collected_movies_file_path)
    # ratings, users = read_ratings_and_users(ratings_file_path)
    series_collected, genres_collected_series_set = read_collected_series(collected_series_file_path)
    # genres_total = genres_collected_movies_set.union(genres_collected_series_set)

    # nomic AI
    # movies_with_embeddings = create_embeddings_for_movies_nomic(
    #     movies=movies_collected, fields_to_use=['name', 'plot', 'genres', 'directors', 'actors']
    # )
    # save_movies_with_embedding_to_csv(movies_with_embeddings, './data/movies_w_embedding_npgda_data.csv')

    # series_with_embeddings = create_embeddings_for_series_nomic(
    #     series=series_collected, fields_to_use=['plot', 'genres', 'directors', 'actors']
    # )
    # save_series_with_embedding_to_csv(series_with_embeddings, './data/series_w_embedding_pgda_data.csv')

    # word2vec
    # movies_with_embeddings_word2vec = create_embeddings_word2vec(
    #     shows=movies_collected, fields_to_use=['plot', 'genres', 'directors', 'actors']
    # )
    # save_movies_with_embedding_to_csv(movies_with_embeddings_word2vec, './data/movies_w_embedding_w2v_pgda_data.csv')
    #
    # series_with_embeddings_word2vec = create_embeddings_word2vec(
    #     shows=series_collected, fields_to_use=['plot', 'genres', 'directors', 'actors']
    # )
    # save_series_with_embedding_to_csv(series_with_embeddings_word2vec, './data/series_w_embedding_w2v_pgda_data.csv')

    # Sentence Transformers

    fields_to_use = ['name', 'plot', 'genres', 'directors', 'actors']
    save_filename = './data/st_ext_npgda_train.json'
    create_train_data(movies_collected, series_collected, fields_to_use, save_filename, train_data_file_ext)
    # train_data = read_train_data(save_filename)
    #
    # movies_with_embeddings_st, series_with_embeddings_st = create_embeddings_sentence_transformer(
    #     movies=movies_collected,  series=series_collected, train_data=train_data,
    #     fields_to_use=fields_to_use
    # )
    # save_movies_with_embedding_to_csv(movies_with_embeddings_st, './data/movies_w_embedding_st_ext_npgda_data.csv')
    # save_series_with_embedding_to_csv(series_with_embeddings_st, './data/series_w_embedding_st_ext_npgda_data.csv')


if __name__ == "__main__":
    create_embeddings()
