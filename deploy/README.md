# Deploying to Kubernetes using Helm

## Build and push docker images

Server:
```bash
cd server
docker login
docker build -t <username>/watchwise-server:latest .
docker push <username>/watchwise-server:latest
```

Client:
```bash
cd client
docker login
docker build -t <username>/watchwise-client:latest .
docker push <username>/watchwise-client:latest
```

## Arangodb operator

Add the helm repo
```bash
helm repo add arangodb https://arangodb.github.io/kube-arangodb
helm repo update
```

Install arangodb-operator
```bash
helm install arangodb-operator arangodb/kube-arangodb
```

## Application helm chart

A helm chart for the application can be found in the `helm/watchwise` folder.

Deploying from that folder:
```bash
helm install watchwise-release .
```


## Uninstall

Deploying from that folder:
```bash
helm uninstall watchwise-release
helm uninstall arangodb-operator
```

# Local testing - minikube

minikube start:
```bash
minikube start --memory=7776 --cpus=4
```

Access ArangoDB
```bash
minikube service arangodb-ea
```

Make sure to use https.
Default credentials:

Username: root
Password - empty