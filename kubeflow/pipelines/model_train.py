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


@dsl.component(packages_to_install=['transformers==4.45.2', 'sentence-transformers==3.1.1', 'boto3==1.36.16'])
def train_model(
        minio_endpoint: str, minio_access_key: str, minio_secret_key: str,
        model_name: str,
        train_data_json: dsl.InputPath()
    ):
    import os
    import json
    import boto3
    import zipfile
    from datasets import Dataset
    from sentence_transformers import SentenceTransformer, losses, SentenceTransformerTrainingArguments, \
        SentenceTransformerTrainer
    from sklearn.model_selection import train_test_split


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
            full_train_data (list): List of training examples with 'text1', 'text2', and 'label'.
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

    os.makedirs(TEMP_DIR, exist_ok=True)
    s3_client.download_file(MODEL_BUCKET, f"{model_name}.zip", MODEL_ZIP_PATH)
    print(f"Downloaded {model_name}.zip to {MODEL_ZIP_PATH}")
    with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(TEMP_DIR)
    print(f"Extracted {model_name}.zip to {TEMP_DIR}")
    model_path = os.path.join(TEMP_DIR, model_name)

    with open(train_data_json, "r", encoding="utf-8") as file:
        train_data = json.load(file)

    model = SentenceTransformer(model_path)
    print(f"Loaded model from {model_path}")
    trained_model_path = "/tmp/model/trained/final"
    fine_tuned_model = fine_tune_model(model, train_data, trained_model_path, 3)
    print(f"Training done.")
    zip_path = f"/tmp/{model_name}.zip"
    zip_folder(trained_model_path, zip_path, model_name)
    s3_client.upload_file(f"{zip_path}", MODEL_BUCKET, f"{model_name}.zip")
    print(f"Uploaded model to {model_name}.zip")


@dsl.component(packages_to_install=['boto3==1.36.16'])
def upload_and_cleanup(train_data_file: dsl.InputPath(),
                    minio_endpoint: str, minio_access_key: str, minio_secret_key: str):
    import os
    import boto3
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

    prefixes_to_delete = ["train/new/"]
    for prefix in prefixes_to_delete:
        objects = s3_client.list_objects_v2(Bucket=DATA_BUCKET, Prefix=prefix)
        if "Contents" in objects:
            for obj in objects["Contents"]:
                s3_client.delete_object(Bucket=DATA_BUCKET, Key=obj["Key"])
                print(f"Deleted {obj['Key']} from {DATA_BUCKET}")



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
    train_model_task = train_model(
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key,
        model_name=model_name,
        train_data_json=get_train_data_task.output
    )

    upload_task = upload_and_cleanup(
        train_data_file=get_train_data_task.output,
        minio_endpoint=minio_endpoint, minio_access_key=access_key, minio_secret_key=secret_key
    )
    upload_task.after(train_model_task)



# Compile the pipeline
if __name__ == "__main__":
    kfp.compiler.Compiler().compile(data_processing_pipeline, "model_train_pipeline.yaml")
