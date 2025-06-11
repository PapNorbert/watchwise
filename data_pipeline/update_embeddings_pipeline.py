from util.read_functions import read_movie_embeddings, read_serie_embeddings
from repository.db_saver import save_embeddings_to_database, clear_collection


initial = [
    "./data/embeddings/initial/movies_w_embedding_st_ext_20_epoch_npgda_data.csv",
    "./data/embeddings/initial/series_w_embedding_st_ext_20_epoch_npgda_data.csv"
]

new = [
    "./data_pipeline/data/embeddings/new/movies_w_embeddings_20250311.csv",
    "./data_pipeline/data/embeddings/new/movies_w_embeddings_20250311.csv"
]           


def update_data_to_database():
    movie_embeddings = []
    serie_embeddings = []

    clear_collection('embeddings')

    for file in initial:
        shows_w_embeddings = None
        if 'movie' in file:
            shows_w_embeddings = read_movie_embeddings(file)
            current_movies_embedding = shows_w_embeddings
            movie_embeddings.append(current_movies_embedding)
            save_embeddings_to_database(current_movies_embedding, [])
        else:
            shows_w_embeddings = read_serie_embeddings(file)
            current_series_embedding = shows_w_embeddings
            serie_embeddings.append(current_series_embedding)
            save_embeddings_to_database([], current_series_embedding)


if __name__ == "__main__":
    update_data_to_database()
