import kfp
from kfp import dsl
from typing import List
import os
import boto3
import json
import csv
import ast
import shutil

@dsl.component(packages_to_install=['boto3==1.36.16', 'minio==7.2.15'])
def download_csv_files():
    MINIO_ENDPOINT = "minio.local:9000"
    ACCESS_KEY = "minio"
    SECRET_KEY = "minio123"
    DATA_BUCKET = "data"
    
    s3_client = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    
    output_dir = "/tmp/new_movies_data"
    os.makedirs(output_dir, exist_ok=True)

    prefixes = ["new_movies/", "new_series/"]
    for prefix in prefixes:
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects["Contents"]:
                file_key = obj["Key"]
                local_file_path = os.path.join(output_dir, os.path.basename(file_key))
                s3_client.download_file(DATA_BUCKET, file_key, local_file_path)
                print(f"Downloaded: {file_key} → {local_file_path}")


@dsl.component
def process_csv_files(input_dir: str):
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
    for file_name in os.listdir(input_dir):
        file_path = os.path.join(input_dir, file_name)
        if "new_movies" in file_name:
            processed_movies.extend(read_collected_movies(file_path))
        elif "new_series" in file_name:
            processed_series.extend(read_collected_series(file_path))

    with open('/tmp/movies.json', "w", encoding="utf-8") as movies_file:
        json.dump(processed_movies, movies_file, indent=4)
    with open('/tmp/series.json', "w", encoding="utf-8") as series_file:
        json.dump(processed_series, series_file, indent=4)


@dsl.component
def cleanup_files(csv_dir: str, json_files: List[str]):
    if os.path.exists(csv_dir):
        shutil.rmtree(csv_dir)
        print(f"Cleaned up the directory: {csv_dir}")
    else:
        print(f"No directory found to clean: {csv_dir}")

    for json_file in json_files:
        if os.path.exists(json_file):
            os.remove(json_file)
            print(f"Deleted JSON file: {json_file}")
        else:
            print(f"JSON file not found: {json_file}")



@dsl.pipeline(
    name="Data Processing Pipeline",
    description="A pipeline for downloading, processing, and cleaning up movie data"
)
def data_processing_pipeline():
    download_task = download_csv_files()
    output_dir = "/tmp/new_movies_data"
    process_task = process_csv_files(
        input_dir=output_dir
    )
    process_task.after(download_task)

    cleanup_task = cleanup_files(
        csv_dir=output_dir,
        json_files=["/tmp/movies.json", "/tmp/series.json"]
    )
    cleanup_task.after(process_task)


# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(data_processing_pipeline, "new_shows_pipeline.yaml")
