# pyright: reportInvalidTypeForm=false

import kfp
from kfp import dsl


@dsl.component(packages_to_install=['boto3==1.36.16'])
def download_csv_files(output_dir: dsl.OutputPath()):
    import os
    import boto3

    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"
    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"
    
    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
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
        movies_output: dsl.OutputPath(str), 
        series_output: dsl.OutputPath(str)):
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


@dsl.component(packages_to_install=['boto3==1.36.16'])
def get_model(model_name: str, model_dir: dsl.OutputPath()):
    import boto3
    import os
    import zipfile
    import shutil

    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"

    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    MODEL_BUCKET = "models"
    TEMP_DIR = "/tmp/models"
    MODEL_ZIP_PATH = os.path.join(TEMP_DIR, f"{model_name}.zip")
    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    os.makedirs(TEMP_DIR, exist_ok=True)
    try:
        s3_client.download_file(MODEL_BUCKET, f"{model_name}.zip", MODEL_ZIP_PATH)
        print(f"Downloaded {model_name}.zip to {MODEL_ZIP_PATH}")
    except Exception as e:
        print(f"Error downloading {model_name}.zip: {e}")
        return
    try:
        with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
            zip_ref.extractall(TEMP_DIR)
        print(f"Extracted {model_name}.zip to {TEMP_DIR}")
    except zipfile.BadZipFile:
        print(f"Error: {MODEL_ZIP_PATH} is not a valid zip file")
        return
    os.remove(MODEL_ZIP_PATH)
    print(f"Deleted {MODEL_ZIP_PATH}, only keeping extracted files")

    os.makedirs(model_dir, exist_ok=True)
    TEMP_MODEL_DIR = os.path.join(TEMP_DIR, model_name)
    shutil.move(TEMP_MODEL_DIR, model_dir)
    print(f"Moved extracted model to {model_dir}")


@dsl.component(packages_to_install=['transformers==4.45.2', 'sentence-transformers==3.1.1'])
def create_embeddings(
        model_name: str,
        model_dir: dsl.InputPath(), 
        movies_json: dsl.InputPath(str), 
        series_json: dsl.InputPath(str),
        fields_to_use: list,
        movies_output: dsl.OutputPath(str), 
        series_output: dsl.OutputPath(str)
        ):
    import os
    import json
    import csv
    from sentence_transformers import SentenceTransformer

    model_path = os.path.join(model_dir, model_name)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model directory {model_path} does not exist.")
    with open(movies_json, "r", encoding="utf-8") as file:
        movies = json.load(file)
    with open(series_json, "r", encoding="utf-8") as file:
        series = json.load(file)

    print(f"Loaded {len(movies)} movies and {len(series)} series.")

    model = SentenceTransformer(model_path)
    print(f"Loaded model from {model_dir}")

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


@dsl.component(packages_to_install=['boto3==1.36.16'])
def upload_and_cleanup(movies_csv: dsl.InputPath(str), series_csv: dsl.InputPath(str)):
    import os
    import boto3
    from datetime import datetime

    MINIO_ENDPOINT = "http://minio-service.kubeflow:9000"

    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"
    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    current_date = datetime.now().strftime("%Y%m%d")
    remote_movie_file = f"embeddings/new/movies_w_embeddings_{current_date}.csv"
    remote_series_file = f"embeddings/new/series_w_embeddings_{current_date}.csv"

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
    csv_download_task = download_csv_files()

    process_task = process_csv_files(
        input_dir=csv_download_task.output,
    )
    
    model_name='watchwise-20-ep'
    model_download_task = get_model(model_name=model_name)

    fields_to_use = ['name', 'plot', 'genres', 'directors', 'actors']
    embedding_task = create_embeddings(
        model_name=model_name,
        model_dir=model_download_task.output, 
        movies_json=process_task.outputs["movies_output"],
        series_json=process_task.outputs["series_output"],
        fields_to_use=fields_to_use
    )

    upload_task = upload_and_cleanup(
        movies_csv=embedding_task.outputs["movies_output"],
        series_csv=embedding_task.outputs["series_output"]
    )



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(data_processing_pipeline, "new_shows_pipeline.yaml")
