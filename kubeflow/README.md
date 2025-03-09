## Kubeflow pipelines

### Deploying Kubeflow pipelines to Kubernetes

#### Deploy Kubeflow pipelines:

```bash
kubectl kustomize github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources | kubectl apply -f -
kubectl wait crd/applications.app.k8s.io --for condition=established --timeout=60s
kubectl kustomize github.com/kubeflow/pipelines/manifests/kustomize/env/platform-agnostic/ | kubectl apply -f -
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



### Remove Kubeflow pipelines deployment


```bash
kubectl kustomize env/platform-agnostic | kubectl delete -f -
kubectl delete applications/pipeline -n kubeflow
kubectl delete -k cluster-scoped-resources/
```





