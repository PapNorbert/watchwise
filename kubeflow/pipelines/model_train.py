# pyright: reportInvalidTypeForm=false

import kfp
from kfp import dsl

@dsl.component(packages_to_install=['boto3==1.36.16'])
def get_train_data(minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
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

    prefixes = ["train/new/"]
    for prefix in prefixes:
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects.get("Contents", []):
                file_key = obj["Key"]
                file_name = os.path.basename(file_key)
                local_file_path = os.path.join(output_dir, file_name)
                s3_client.download_file(DATA_BUCKET, file_key, local_file_path)
                print(f"Downloaded: {file_key} → {local_file_path}")

    print(f"Download complete for all files in {output_dir}")


@dsl.component(packages_to_install=['transformers==4.45.2', 'sentence-transformers==3.1.1', 
    'boto3==1.36.16', 'datasets==3.1.0', 'torch==2.5.0', 'accelerate==1.1.1', 'python-arango==8.1.0'])
def train_model(
        minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
        url: str, db_name: str, username: str, password: str,
        model_name: str, fields_to_use: list,
        train_data_folder: dsl.InputPath(),
        new_movie_embeddings_output: dsl.OutputPath(), 
        new_serie_embeddings_output: dsl.OutputPath()
    ):
    import os
    import json
    import boto3
    import zipfile
    import ast
    import csv
    import uuid
    from datasets import Dataset
    from sentence_transformers import SentenceTransformer, losses, SentenceTransformerTrainingArguments, \
        SentenceTransformerTrainer
    from sklearn.model_selection import train_test_split
    from arango import ArangoClient


    MODEL_BUCKET = "models"
    TEMP_DIR = "/tmp/models"
    MODEL_ZIP_PATH = os.path.join(TEMP_DIR, f"{model_name}.zip")

    s3_client = boto3.client(
        "s3",
        endpoint_url=minio_endpoint,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key
    )

    def fine_tune_model(model, full_train_data, trained_model_path, epochs=1):
        """
        Fine-tune the SentenceTransformer model using the provided training data.

        Args:
            model: The model to be fine tuned.
            full_train_data (list): List of training examples with 'text1', 'text2', and 'label'.
            trained_model_path (string): The location to save the final model.
            epochs (int): Number of epochs for fine-tuning.

        Returns:
            model (SentenceTransformer): Fine-tuned SentenceTransformer model.
        """
        train_data, eval_data = train_test_split(full_train_data, test_size=0.1, random_state=42)

        train_dataset = Dataset.from_dict({
            'sentence1': [item['text1'] for item in train_data],
            'sentence2': [item['text2'] for item in train_data],
            'score': [item['label'] for item in train_data],
        })
        eval_dataset = Dataset.from_dict({
            'sentence1': [(item['text1']) for item in eval_data],
            'sentence2': [item['text2'] for item in eval_data],
            'score': [item['label'] for item in eval_data],
        })
        train_loss = losses.CosineSimilarityLoss(model=model)

        args = SentenceTransformerTrainingArguments(
            # Required parameter:
            output_dir="/tmp/model/trained",
            # Optional training parameters:
            num_train_epochs=epochs,
            warmup_ratio=0.1,
            # Optional tracking/debugging parameters:
            eval_strategy="steps",
            eval_steps=300,
            save_strategy="steps",
            save_steps=300,
            save_total_limit=2,
            load_best_model_at_end=True,
            logging_steps=100
        )
        trainer = SentenceTransformerTrainer(
            model=model,
            args=args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            loss=train_loss,
        )
        trainer.train()
        model.save_pretrained(trained_model_path)
        return model

    def zip_folder(folder_path, output_zip, model_name):
        print('Creating ZIP')
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(folder_path):
                for dir in dirs:
                    zip_folder_path = os.path.join(root, dir)
                    rel_path = os.path.relpath(zip_folder_path, folder_path)
                    zipf.write(zip_folder_path, os.path.join(model_name, rel_path) + '/')
                for file in files:
                    abs_path = os.path.join(root, file)
                    rel_path = os.path.relpath(abs_path, folder_path)
                    zipf.write(abs_path, os.path.join(model_name, rel_path))
        print(f"ZIP created at {output_zip}.zip")

    def update_embeddings(model, fields_to_use):

        def clear_collection(collection_name):
            try:
                client = ArangoClient(hosts=url, request_timeout=240, verify_override=False)
                db = client.db(db_name, username=username, password=password)
                collection = db.collection(collection_name)
                collection.truncate()
                print(f"Collection '{collection_name}' has been cleared.")
                return True
            except Exception as e:
                print(f"Error clearing collection '{collection_name}': {e}")
                return False

        def read_movie_embeddings(file_path):
            with open(file_path, mode='r', encoding='utf-8') as file:
                csv_reader = csv.reader(file)
                header = next(csv_reader)
                movies_w_embeddings = []
                for row in csv_reader:
                    row_embedding = ast.literal_eval(row[14]) if row[14] else []
                    movies_w_embeddings.append({
                        'movieId': row[0],
                        'name': row[4],
                        'poster': row[12],
                        'embedding': row_embedding,
                    })
                return movies_w_embeddings

        def read_serie_embeddings(file_path):
            with open(file_path, mode='r', encoding='utf-8') as file:
                csv_reader = csv.reader(file)
                _header = next(csv_reader)
                movies_w_embeddings = []
                for row in csv_reader:
                    row_embedding = ast.literal_eval(row[18]) if row[18] else []
                    movies_w_embeddings.append({
                        'series_id': row[0],
                        'name': row[3],
                        'poster': row[14],
                        'embedding': row_embedding,
                    })
                return movies_w_embeddings

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
                        '_from': f"movies/{movie_key}",
                        '_to': f"embeddings/{embedding_key}"
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
                        '_from': f"series/{serie_key}",
                        '_to': f"embeddings/{embedding_key}"
                    })

                print('Saving', len(embeddings), 'embeddings')
                save_many_to_database_in_batches('embeddings', embeddings)
                print('Saving', len(has_embedding_edges), 'has embedding edges')
                save_many_to_database_in_batches('has_embedding', has_embedding_edges)
            except Exception as e:
                print(e)

        def generate_key() -> str:
            try:
                unique_id = uuid.uuid4()
                numeric_key = unique_id.int
                return str(numeric_key)
            except Exception as e:
                print(e)

        def save_many_to_database_in_batches(collection_name, data, batch_size=1000):
            try:
                client = ArangoClient(hosts=url, request_timeout=2000, verify_override=False)
                db = client.db(db_name, username=username, password=password)
                collection = db.collection(collection_name)
                # Break the data into smaller batches and insert them
                for i in range(0, len(data), batch_size):
                    batch = data[i:i+batch_size]
                    result = collection.insert_many(batch, overwrite=True, overwrite_mode='update')
                    print(f'Saved batch of {len(batch)} items to {collection_name}')
                
                return result
            except Exception as e:
                print(f"Error saving {collection_name}: {e}")
                return []
        
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

        DATA_BUCKET = "data"

        movie_embeddings = []
        serie_embeddings = []

        clear_collection('embeddings')

        print("Updating all embeddings.")

        # download show files
        shows_dir = '/tmp/shows'
        os.makedirs(shows_dir, exist_ok=True)
        prefixes = ["embeddings/initial/", "embeddings/new/"]
        for prefix in prefixes:
            objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
            if "Contents" in objects:
                for obj in objects.get("Contents", []):
                    file_key = obj["Key"]
                    local_file_path = os.path.join(shows_dir, os.path.basename(file_key))
                    s3_client.download_file(DATA_BUCKET, file_key, local_file_path)
                    print(f"Downloaded: {file_key} → {local_file_path}")
                    # processing the file
                    if 'movie' in file_key:
                        movies_w_embeddings = read_movie_embeddings(file)
                        current_movies_embedding = generate_embeddings_sentence_transformer(movies_w_embeddings, fields_to_use, model)
                        movie_embeddings.append(current_movies_embedding)
                        save_embeddings_to_database(current_movies_embedding, [])
                    else:
                        # file contains series
                        series_w_embeddings = read_serie_embeddings(file)
                        current_series_embedding = generate_embeddings_sentence_transformer(series_w_embeddings, fields_to_use, model)
                        serie_embeddings.append(current_series_embedding)
                        save_embeddings_to_database([], current_series_embedding)

        save_movies_with_embedding_to_csv(movie_embeddings, new_movie_embeddings_output)
        save_series_with_embedding_to_csv(serie_embeddings, new_serie_embeddings_output)


    os.makedirs(TEMP_DIR, exist_ok=True)
    s3_client.download_file(MODEL_BUCKET, f"{model_name}.zip", MODEL_ZIP_PATH)
    print(f"Downloaded {model_name}.zip to {MODEL_ZIP_PATH}")
    with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(TEMP_DIR)
    print(f"Extracted {model_name}.zip to {TEMP_DIR}")
    model_path = os.path.join(TEMP_DIR, model_name)

    print("Files in directory:", os.listdir(train_data_folder))
    train_data = []
    for filename in os.listdir(train_data_folder):
        file_path = os.path.join(train_data_folder, filename)
        if filename.endswith(".json"):
            with open(file_path, "r", encoding="utf-8") as file:
                try:
                    data = json.load(file)
                    if isinstance(data, list):
                        train_data.extend(data)
                    else:
                        print(f"Skipping {filename}: not an array")
                except json.JSONDecodeError:
                    print(f"Skipping {filename}: invalid JSON")
    print(f"Processing {len(train_data)} training data.")

    model = SentenceTransformer(model_path)
    print(f"Loaded model from {model_path}")
    trained_model_path = "/tmp/model/trained/final"
    fine_tuned_model = fine_tune_model(model, train_data, trained_model_path, 3)
    print(f"Training done.")
    update_embeddings(fine_tuned_model, fields_to_use)
    zip_path = f"/tmp/{model_name}.zip"
    zip_folder(trained_model_path, zip_path, model_name)
    s3_client.upload_file(f"{zip_path}", MODEL_BUCKET, f"{model_name}.zip")
    print(f"Uploaded model to {model_name}.zip")


@dsl.component(packages_to_install=['boto3==1.36.16'])
def upload_and_cleanup(train_data_file: dsl.InputPath(),
                    minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
                    new_movie_embeddings: dsl.InputPath(), 
                    new_serie_embeddings: dsl.InputPath()):
    import os
    import boto3
    import json
    from datetime import datetime


    DATA_BUCKET = "data"
    s3_client = boto3.client(
        "s3",
        endpoint_url=minio_endpoint,
        aws_access_key_id=minio_access_key,
        aws_secret_access_key=minio_secret_key
    )
    current_date = datetime.now().strftime("%Y%m%d")
    remote_train_file = f"train/processed/training_{current_date}.csv"

    if os.path.exists(train_data_file):
        s3_client.upload_file(train_data_file, DATA_BUCKET, remote_train_file)
        print(f"Uploaded {train_data_file} to {remote_train_file}")

    prefixes_to_delete = ["train/new/", "embeddings/initial/", "embeddings/new/"]
    for prefix in prefixes_to_delete:
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects["Contents"]:
                s3_client.delete_object(Bucket=DATA_BUCKET, Key=obj["Key"])
                print(f"Deleted {obj['Key']} from {DATA_BUCKET}")

    remote_movies_file = f"embeddings/initial/movies_w_embeddings_{current_date}.csv"
    if os.path.exists(new_movie_embeddings):
        s3_client.upload_file(new_movie_embeddings, DATA_BUCKET, remote_movies_file)
        print(f"Uploaded {new_movie_embeddings} to {remote_movies_file}")

    remote_series_file = f"embeddings/initial/series_w_embeddings_{current_date}.csv"
    if os.path.exists(new_serie_embeddings):
        s3_client.upload_file(new_serie_embeddings, DATA_BUCKET, remote_series_file)
        print(f"Uploaded {new_serie_embeddings} to {remote_series_file}")


@dsl.pipeline(
    name="Model Train Pipeline",
    description="A pipeline for training the model with new data"
)
def data_processing_pipeline():
    minio_endpoint = "http://minio-service.kubeflow:9000"
    access_key = "minio"
    secret_key = "minio123"

    get_train_data_task = get_train_data(
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key
    )
    
    model_name='watchwise-20-ep'
    fields_to_use = ['name', 'plot', 'genres', 'directors', 'actors']
    url = 'https://arangodb.default.svc.cluster.local:8529'
    password=''
    username='root'
    db_name='watchwiseRecommend'
    train_model_task = train_model(
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key,
        url=url, db_name=db_name, username=username, password=password,
        model_name=model_name,
        fields_to_use=fields_to_use,
        train_data_folder=get_train_data_task.output
    ).set_memory_limit("6Gi").set_cpu_limit("4")

    upload_task = upload_and_cleanup(
        train_data_file=get_train_data_task.output,
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key,
        new_movie_embeddings=train_model_task.outputs["new_movie_embeddings_output"],
        new_serie_embeddings=train_model_task.outputs["new_serie_embeddings_output"],
    )
    upload_task.after(train_model_task)



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(data_processing_pipeline, "model_train_pipeline.yaml")
