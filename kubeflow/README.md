## Kubeflow pipelines

### Deploying Kubeflow pipelines to Kubernetes

#### Deploy Kubeflow pipelines:

```bash
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=2.3.0"
kubectl wait --for condition=established --timeout=60s crd/applications.app.k8s.io
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/env/dev?ref=2.3.0"
```

#### Accessing Kubeflow Pipelines UI:

```bash
kubectl port-forward -n kubeflow svc/ml-pipeline-ui 8080:80
```

### MinIO - Object Storage for Kubeflow

MinIO is a high-performance, S3-compatible object storage system used in Kubeflow Pipelines for storing and managing large datasets, models, and artifacts. It serves as the primary storage backend for Kubeflow, allowing users to upload and retrieve files efficiently.

##### Accessing MinIO’s web interface

```bash
kubectl port-forward -n kubeflow svc/minio-service 9000:9000
```

Default credentials:
  - Username: minio
  - Password: minio123

Uploading Files:
  - Create a new bucket (e.g., models or data).
  - Upload your SentenceTransformers model zip or CSV files.
  - Use these files in your Kubeflow Pipelines for training and inference.











