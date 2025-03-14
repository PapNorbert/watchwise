# pyright: reportInvalidTypeForm=false

import kfp
from kfp import dsl


@dsl.component(packages_to_install=['boto3==1.36.16'])
def download_csv_files(minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
                       output_dir: dsl.OutputPath()):
    import os
    import boto3

    DATA_BUCKET = "data"
    
    s3_client = boto3.client(
        "s3",
        endpoint_url=minio_endpoint,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key
    )
    
    os.makedirs(output_dir, exist_ok=True)

    prefixes = ["new_movies/", "new_series/"]
    for prefix in prefixes:
        output_folder = os.path.join(output_dir, prefix)
        os.makedirs(output_folder, exist_ok=True)
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects.get("Contents", []):
                file_key = obj["Key"]
                local_file_path = os.path.join(output_folder, os.path.basename(file_key))
                s3_client.download_file(DATA_BUCKET, file_key, local_file_path)
                print(f"Downloaded: {file_key} → {local_file_path}")

    print(f"Download complete for all files in {output_dir}")


@dsl.component
def process_csv_files(
        input_dir: dsl.InputPath(),
        movies_output: dsl.OutputPath(), 
        series_output: dsl.OutputPath()):
    import os
    import json
    import csv
    import ast

    def read_collected_movies(file_path):
        with open(file_path, mode="r", encoding="utf-8") as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            movies_collected = []
            for row in csv_reader:
                row_genres = ast.literal_eval(row[2]) if row[2] else []
                row_ratings = ast.literal_eval(row[13]) if row[13] else []
                row_directors = row[5].split(", ") if row[5] else []
                row_writers = row[6].split(", ") if row[6] else []
                row_actors = row[7].split(", ") if row[7] else []
                row_languages = row[9].split(", ") if row[9] else []

                movies_collected.append(
                    {
                        "movieId": row[0],
                        "title": row[1],
                        "genres": row_genres,
                        "imdb_link": row[3],
                        "name": row[4],
                        "directors": row_directors,
                        "writers": row_writers,
                        "actors": row_actors,
                        "plot": row[8],
                        "languages": row_languages,
                        "country_of_origin": row[10],
                        "awards": row[11],
                        "poster": row[12],
                        "ratings": row_ratings,
                    }
                )
        return movies_collected

    def read_collected_series(file_path):
        with open(file_path, mode="r", encoding="utf-8") as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            series_collected = []
            for row in csv_reader:
                row_genres = [genre.strip() for genre in row[6].split(", ") if genre.strip() and genre.strip() != "N/A"] if row[6] else []
                ratings_row = ast.literal_eval(row[15]) if row[15] else []
                vote_average = (float(row[1]) / 2) if row[1] else 0.0
                vote_count = int(row[2]) if row[2] else 0
                directors_row = [director.strip() for director in row[7].split(", ") if director.strip() and director.strip() != "N/A"] if row[7] else []
                writers_row = [writer.strip() for writer in row[8].split(", ") if writer.strip() and writer.strip() != "N/A"] if row[8] else []
                actors_row = [actor.strip() for actor in row[9].split(", ") if actor.strip() and actor.strip() != "N/A"] if row[9] else []
                row_languages = [language.strip() for language in row[11].split(", ") if language.strip() and language.strip() != "N/A"] if row[11] else []

                series_collected.append(
                    {
                        "series_id": row[0],
                        "vote_average": vote_average,
                        "vote_count": vote_count,
                        "name": row[3],
                        "year": row[4],
                        "release_date": row[5],
                        "genres": row_genres,
                        "directors": directors_row,
                        "writers": writers_row,
                        "actors": actors_row,
                        "plot": row[10],
                        "languages": row_languages,
                        "country_of_origin": row[12],
                        "awards": row[13],
                        "poster": row[14],
                        "ratings": ratings_row,
                        "imdb_link": row[16],
                        "total_seasons": row[17],
                    }
                )
        return series_collected
    
    processed_movies = []
    processed_series = []
    movies_dir = os.path.join(input_dir, "new_movies")
    series_dir = os.path.join(input_dir, "new_series")

    if os.path.exists(movies_dir):
        for file_name in os.listdir(movies_dir):
            file_path = os.path.join(movies_dir, file_name)
            if file_name.endswith(".csv"):
                print(f'Processing {file_path}')
                processed_movies.extend(read_collected_movies(file_path))
    if os.path.exists(series_dir):
        for file_name in os.listdir(series_dir):
            file_path = os.path.join(series_dir, file_name)
            if file_name.endswith(".csv"):
                print(f'Processing {file_path}')
                processed_series.extend(read_collected_series(file_path))
    with open(movies_output, "w", encoding="utf-8") as movies_file:
        json.dump(processed_movies, movies_file, indent=4)
    with open(series_output, "w", encoding="utf-8") as series_file:
        json.dump(processed_series, series_file, indent=4)


@dsl.component(packages_to_install=['transformers==4.45.2', 'sentence-transformers==3.1.1', 'boto3==1.36.16'])
def create_embeddings(
        minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
        model_name: str,
        movies_json: dsl.InputPath(), 
        series_json: dsl.InputPath(),
        fields_to_use: list,
        movies_output: dsl.OutputPath(), 
        series_output: dsl.OutputPath()
        ):
    import os
    import json
    import csv
    import boto3
    import zipfile
    from sentence_transformers import SentenceTransformer

    MODEL_BUCKET = "models"
    TEMP_DIR = "/tmp/models"
    MODEL_ZIP_PATH = os.path.join(TEMP_DIR, f"{model_name}.zip")

    s3_client = boto3.client(
        "s3",
        endpoint_url=minio_endpoint,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key
    )
    os.makedirs(TEMP_DIR, exist_ok=True)
    s3_client.download_file(MODEL_BUCKET, f"{model_name}.zip", MODEL_ZIP_PATH)
    print(f"Downloaded {model_name}.zip to {MODEL_ZIP_PATH}")
    with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(TEMP_DIR)
    print(f"Extracted {model_name}.zip to {TEMP_DIR}")
    model_path = os.path.join(TEMP_DIR, model_name)

    with open(movies_json, "r", encoding="utf-8") as file:
        movies = json.load(file)
    with open(series_json, "r", encoding="utf-8") as file:
        series = json.load(file)

    print(f"Loaded {len(movies)} movies and {len(series)} series.")

    model = SentenceTransformer(model_path)
    print(f"Loaded model from {model_path}")

    def generate_embeddings_sentence_transformer(shows, fields_to_use, model):
        show_texts = []
        for show in shows:
            combined_text = []
            for field in fields_to_use:
                if isinstance(show[field], list):
                    combined_text.append(', '.join(show[field]))
                else:
                    combined_text.append(show[field])
            show_texts.append(' '.join(combined_text))
        embeddings = model.encode(show_texts, show_progress_bar=True)
        for i, show in enumerate(shows):
            show['embedding'] = embeddings[i].tolist()
        return shows

    movies_with_embeddings = generate_embeddings_sentence_transformer(movies, fields_to_use, model)
    series_with_embeddings = generate_embeddings_sentence_transformer(series, fields_to_use, model)

    print("Embeddings generated successfully.")

    # Save functions
    def save_movies_with_embedding_to_csv(movies_data, filename):
        header = [
            'movieId', 'title', 'genres', 'imdb_link', 'name', 'directors', 'writers', 'actors', 'plot',
            'languages', 'country_of_origin', 'awards', 'poster', 'ratings', 'embedding'
        ]
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=header)
            writer.writeheader()
            for movie in movies_data:
                try:
                    ordered_movie = {key: movie.get(key, '') for key in header}
                    writer.writerow(ordered_movie)
                except Exception as e:
                    print(f"Error processing movie {movie['title']}: {e}")

    def save_series_with_embedding_to_csv(series_data, filename):
        header = [
            'series_id', 'vote_average', 'vote_count', 'name', 'year', 'release_date', 'genres', 'directors',
            'writers', 'actors', 'plot', 'languages', 'country_of_origin', 'awards', 'poster',
            'ratings', 'imdb_link', 'total_seasons', 'embedding'
        ]
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=header)
            writer.writeheader()
            for serie in series_data:
                try:
                    ordered_serie = {key: serie.get(key, '') for key in header}
                    writer.writerow(ordered_serie)
                except Exception as e:
                    print(f"Error processing series {serie['name']}: {e}")

    save_movies_with_embedding_to_csv(movies_with_embeddings, movies_output)
    save_series_with_embedding_to_csv(series_with_embeddings, series_output)
    print(f"Saved movie embeddings to {movies_output}")
    print(f"Saved series embeddings to {series_output}")


@dsl.component(packages_to_install=['boto3==1.36.16', 'python-arango==8.1.0'])
def upload_and_cleanup(movies_csv: dsl.InputPath(), series_csv: dsl.InputPath(),
                    url: str, db_name: str, username: str, password: str,
                    minio_endpoint: str, minio_access_key: str, minio_secret_key: str):
    import os
    import boto3
    import uuid
    import csv
    import ast
    import re
    from datetime import datetime
    from arango import ArangoClient


    DATA_BUCKET = "data"
    s3_client = boto3.client(
        "s3",
        endpoint_url=minio_endpoint,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key
    )
    current_date = datetime.now().strftime("%Y%m%d")
    remote_movie_file = f"embeddings/new/movies_w_embeddings_{current_date}.csv"
    remote_series_file = f"embeddings/new/series_w_embeddings_{current_date}.csv"
    genre_cache = {}

    def read_movies_with_embeddings(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            movies = []
            for row in csv_reader:
                # arrays
                row_genres = ast.literal_eval(row[2]) if row[2] else []
                row_directors = row[5].split(', ') if row[5] else []
                row_writers = row[6].split(', ') if row[6] else []
                row_actors = row[7].split(', ') if row[7] else []
                row_languages = row[9].split(', ') if row[9] else []
                row_ratings = ast.literal_eval(row[13]) if row[13] else []
                embedding = ast.literal_eval(row[14]) if row[14] else []

                movies.append({
                    'movieId': row[0],
                    'title': row[1],
                    'genres': row_genres,
                    'imdb_link': row[3],
                    'name': row[4],
                    'directors': row_directors,
                    'writers': row_writers,
                    'actors': row_actors,
                    'plot': row[8],
                    'languages': row_languages,
                    'country_of_origin': row[10],
                    'awards': row[11],
                    'poster': row[12],
                    'ratings': row_ratings,
                    'embedding': embedding
                })
            return movies

    def read_series_with_embeddings(file_path):
        with open(file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            header = next(csv_reader)
            series = []
            for row in csv_reader:
                # arrays
                vote_average = (float(row[1]) / 2) if row[1] else 0.0
                vote_count = int(row[2]) if row[2] else 0
                row_genres = ast.literal_eval(row[6]) if row[6] else []
                directors_row = ast.literal_eval(row[7]) if row[7] else []
                writers_row = ast.literal_eval(row[8]) if row[8] else []
                actors_row = ast.literal_eval(row[9]) if row[9] else []
                row_languages = ast.literal_eval(row[11]) if row[11] else []
                ratings_row = ast.literal_eval(row[15]) if row[15] else []
                embedding_row = ast.literal_eval(row[18]) if row[18] else []

                series.append({
                    'series_id': row[0],
                    'vote_average': vote_average,
                    'vote_count': vote_count,
                    'name': row[3],
                    'year': row[4],
                    'release_date': row[5],
                    'genres': row_genres,
                    'directors': directors_row,
                    'writers': writers_row,
                    'actors': actors_row,
                    'plot': row[10],
                    'languages': row_languages,
                    'country_of_origin': row[12],
                    'awards': row[13],
                    'poster': row[14],
                    'ratings': ratings_row,
                    'imdb_link': row[16],
                    'total_seasons': row[17],
                    'embedding': embedding_row
                })
            return series

    def set_series_values(current_serie, serie):
        if serie['name'] and serie['name'] != 'N/A':
            current_serie.update({'name': serie['name']})
        if (serie['directors'] and serie['directors'] != 'N/A' and serie['directors'] != ['N/A']
                and serie['directors'] != []):
            current_serie.update({'directors': serie['directors']})
        if (serie['writers'] and serie['writers'] != 'N/A' and serie['writers'] != ['N/A']
                and serie['writers'] != []):
            current_serie.update({'writers': serie['writers']})
        if (serie['actors'] and serie['actors'] != 'N/A' and serie['actors'] != ['N/A']
                and serie['actors'] != []):
            current_serie.update({'actors': serie['actors']})
        if serie['release_date'] and serie['release_date'] != 'N/A':
            current_serie.update({'original_release': serie['release_date']})
        if serie['year'] and serie['year'] != 'N/A':
            current_serie.update({'year': serie['year']})
        if serie['total_seasons'] and serie['total_seasons'] != 'N/A':
            current_serie.update({'nr_seasons': serie['total_seasons']})
        if (serie['plot'] and serie['plot'] != 'N/A' and serie['plot'] != ['N/A']
                and serie['plot'] != []):
            current_serie.update({'storyline': serie['plot']})
        if (serie['country_of_origin'] and serie['country_of_origin'] != 'N/A' and
                serie['country_of_origin'] != ['N/A'] and serie['country_of_origin'] != []):
            current_serie.update({'country_of_origin': serie['country_of_origin']})
        if (serie['languages'] and serie['languages'] != 'N/A' and serie['languages'] != ['N/A']
                and serie['languages'] != []):
            current_serie.update({'languages': serie['languages']})
        if (serie['awards'] and serie['awards'] != 'N/A' and serie['awards'] != ['N/A']
                and serie['awards'] != []):
            current_serie.update({'awards': serie['awards']})
        if (serie['poster'] and serie['poster'] != 'N/A' and serie['poster'] != ['N/A']
                and serie['poster'] != []):
            current_serie.update({'img_name': serie['poster']})
        if serie['imdb_link'] and serie['imdb_link'] != 'N/A':
            current_serie.update({'imdb_link': serie['imdb_link']})

    def extract_year_from_title(title):
        match = re.search(r'\(([^()]+)\)\s*$', title)
        if match:
            return match.group(1)
        return None

    def set_movie_values(current_movie, movie):
        if movie['name'] and movie['name'] != 'N/A':
            current_movie.update({'name': movie['name']})
        if (movie['directors'] and movie['directors'] != 'N/A' and movie['directors'] != ['N/A']
                and movie['directors'] != []):
            current_movie.update({'directors': movie['directors']})
        if (movie['writers'] and movie['writers'] != 'N/A' and movie['writers'] != ['N/A']
                and movie['writers'] != []):
            current_movie.update({'writers': movie['writers']})
        if (movie['actors'] and movie['actors'] != 'N/A' and movie['actors'] != ['N/A']
                and movie['actors'] != []):
            current_movie.update({'actors': movie['actors']})
        movie_year = extract_year_from_title(movie['title'])
        if movie_year:
            current_movie.update({'year': movie_year})
        if (movie['plot'] and movie['plot'] != 'N/A' and movie['plot'] != ['N/A']
                and movie['plot'] != []):
            current_movie.update({'storyline': movie['plot']})
        if (movie['country_of_origin'] and movie['country_of_origin'] != 'N/A' and
                movie['country_of_origin'] != ['N/A'] and movie['country_of_origin'] != []):
            current_movie.update({'country_of_origin': movie['country_of_origin']})
        if (movie['languages'] and movie['languages'] != 'N/A' and movie['languages'] != ['N/A']
                and movie['languages'] != []):
            current_movie.update({'languages': movie['languages']})
        if (movie['awards'] and movie['awards'] != 'N/A' and movie['awards'] != ['N/A']
                and movie['awards'] != []):
            current_movie.update({'awards': movie['awards']})
        if (movie['poster'] and movie['poster'] != 'N/A' and movie['poster'] != ['N/A']
                and movie['poster'] != []):
            current_movie.update({'img_name': movie['poster']})
        if movie['imdb_link'] and movie['imdb_link'] != 'N/A':
            current_movie.update({'imdb_link': movie['imdb_link']})

    def get_genre_key(genre_name):
        if genre_name in genre_cache:
            return genre_cache[genre_name]
        try:
            client = ArangoClient(hosts=url, request_timeout=240, verify_override=False)
            db = client.db(db_name, username=username, password=password)
            genres_collection = db.collection('genres')
            genre = genres_collection.find({'name': genre_name}, limit=1)
            return genre[0]['_key'] if genre else None
        except Exception as e:
            print(e)
            return None

    def save_series(series):
        try:
            series_list = []
            genre_edges = []
            for serie in series:
                serie_id = serie['series_id']
                current_serie = {'_key': serie_id}
                set_series_values(current_serie, serie)
                if serie['genres']:
                    for genre in serie['genres']:
                        genre_key = get_genre_key(genre)
                        genre_edges.append({
                            '_key': f'88{serie_id}{genre_key}{genre_key}{serie_id}',
                            '_from': f'series/{serie_id}',
                            '_to': f'genres/{genre_key}'
                        })
                current_serie.update({
                    'total_ratings': 0,
                    'average_rating': 0.0,
                    'sum_of_ratings': 0.0,
                })
                series_list.append(current_serie)
            print('Saving', len(series_list), 'series')
            save_many_to_database('series', series_list)
            print('Saving', len(genre_edges), 'his_type edges - genres of series')
            save_many_to_database('his_type', genre_edges)
        except Exception as e:
            print(e)

    def save_movies(movies):
        try:
            movie_list = []
            genre_edges = []
            for movie in movies:
                movie_id = movie['movieId']
                current_movie = {'_key': movie_id}
                set_movie_values(current_movie, movie)
                if movie['genres']:
                    for genre in movie['genres']:
                        genre_key = get_genre_key(genre)
                        genre_edges.append({
                            '_key': f'33{movie_id}{genre_key}{genre_key}{movie_id}',
                            '_from': f'movies/{movie_id}',
                            '_to': f'genres/{genre_key}'
                        })
                current_movie.update({
                    'sum_of_ratings': 0,
                    'total_ratings': 0.0,
                    'average_rating': 0.0
                })
                movie_list.append(current_movie)
            print('Saving', len(movie_list), 'movies')
            save_many_to_database('movies', movie_list)
            print('Saving', len(genre_edges), 'his_type edges - genres of movies')
            save_many_to_database('his_type', genre_edges)
        except Exception as e:
            print(e)

    def save_embeddings_to_database(movie_embeddings, series_embeddings):
        try:
            embeddings = []
            has_embedding_edges = []
            for movie_embedding in movie_embeddings:
                embedding_key = generate_key()
                movie_key = movie_embedding['movieId']
                embeddings.append({
                    '_key': embedding_key,
                    'show_key': movie_key,
                    'show_type': 'movie',
                    'show_name': movie_embedding['name'],
                    **({'img_name': movie_embedding['poster']} if
                    'poster' in movie_embedding and movie_embedding['poster'] != 'N/A' else {}),
                    'embedding_vector': movie_embedding['embedding']
                })
                has_embedding_edges.append({
                    '_key': embedding_key,
                    '_from': f'movies/{movie_key}',
                    '_to': f'embeddings/{embedding_key}'
                })
            for serie_embeddings in series_embeddings:
                embedding_key = generate_key()
                serie_key = serie_embeddings['series_id']
                embeddings.append({
                    '_key': embedding_key,
                    'show_key': serie_key,
                    'show_type': 'serie',
                    'show_name': serie_embeddings['name'],
                    **({'img_name': serie_embeddings['poster']} if
                    'poster' in serie_embeddings and serie_embeddings['poster'] != 'N/A' else {}),
                    'embedding_vector': serie_embeddings['embedding']
                })
                has_embedding_edges.append({
                    '_key': embedding_key,
                    '_from': f'series/{serie_key}',
                    '_to': f'embeddings/{embedding_key}'
                })

            print('Saving', len(embeddings), 'embeddings')
            save_many_to_database('embeddings', embeddings)
            print('Saving', len(has_embedding_edges), 'has embedding edges')
            save_many_to_database('has_embedding', has_embedding_edges)
        except Exception as e:
            print(e)

    def save_many_to_database(collection_name, data):
        try:
            client = ArangoClient(hosts=url, request_timeout=240, verify_override=False)
            db = client.db(db_name, username=username, password=password)
            collection = db.collection(collection_name)
            result = collection.insert_many(data, overwrite=True, overwrite_mode='update')
            return result
        except Exception as e:
            print(e)
            return []
        
    def generate_key() -> str:
        try:
            unique_id = uuid.uuid4()
            numeric_key = unique_id.int
            return str(numeric_key)
        except Exception as e:
            print(e)


    movies = read_movies_with_embeddings(movies_csv)
    series = read_series_with_embeddings(series_csv)
    save_series(series)
    save_movies(movies)
    save_embeddings_to_database(movie_embeddings=movies, series_embeddings=series)

    if os.path.exists(movies_csv):
        s3_client.upload_file(movies_csv, DATA_BUCKET, remote_movie_file)
        print(f"Uploaded {movies_csv} to {remote_movie_file}")
    if os.path.exists(series_csv):
        s3_client.upload_file(series_csv, DATA_BUCKET, remote_series_file)
        print(f"Uploaded {series_csv} to {remote_series_file}")

    prefixes_to_delete = ["new_movies/", "new_series/"]
    for prefix in prefixes_to_delete:
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects["Contents"]:
                s3_client.delete_object(Bucket=DATA_BUCKET, Key=obj["Key"])
                print(f"Deleted {obj['Key']} from {DATA_BUCKET}")


@dsl.pipeline(
    name="New Show Data Processing Pipeline",
    description="A pipeline for downloading, creating embeddings, and cleaning up new show data"
)
def data_processing_pipeline():
    minio_endpoint = "http://minio-service.kubeflow:9000"
    access_key = "minio"
    secret_key = "minio123"

    csv_download_task = download_csv_files(
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key
    )

    process_task = process_csv_files(
        input_dir=csv_download_task.output,
    )
    
    model_name='watchwise-20-ep'

    fields_to_use = ['name', 'plot', 'genres', 'directors', 'actors']
    embedding_task = create_embeddings(
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key,
        model_name=model_name,
        movies_json=process_task.outputs["movies_output"],
        series_json=process_task.outputs["series_output"],
        fields_to_use=fields_to_use
    )

    url = 'https://arangodb.default.svc.cluster.local:8529'
    password=''
    username='root'
    db_name='watchwiseRecommend'

    upload_task = upload_and_cleanup(
        movies_csv=embedding_task.outputs["movies_output"],
        series_csv=embedding_task.outputs["series_output"],
        url=url, db_name=db_name, username=username, password=password,
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key
    )



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(data_processing_pipeline, "new_shows_pipeline.yaml")
