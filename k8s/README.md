# Kubernetes Deployment Guide for Molen

This guide covers deploying the Molen Self-Service Fraud-Ops Platform to Kubernetes (tested on OpenShift).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Configuration](#configuration)
5. [Deployment Steps](#deployment-steps)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- `kubectl` CLI tool (v1.28+)
- `docker` or `podman` (for local builds)
- Access to Kubernetes cluster with `cluster-admin` or appropriate permissions
- GitHub account (for GHCR - GitHub Container Registry)

### Kubernetes Cluster Requirements

- Kubernetes 1.24+
- LoadBalancer support (or Ingress controller)
- Minimum resources:
  - 2 CPU cores
  - 2GB RAM
  - 10GB storage

### Credentials Needed

You'll need credentials for:
- Flink (Cloudflare Access)
- Elasticsearch
- Redis
- S3/Cloudflare R2
- Redpanda

## Quick Start

### 1. Set up environment variables

```bash
# Kubernetes cluster
export KUBE_API_URL="https://api.rm1.0a51.p1.openshiftapps.com:6443"
export KUBE_SERVICE_TOKEN="<your-service-account-token>"
export KUBE_NAMESPACE="sayyidyofa-dev"

# Application credentials
export FLINK_CLIENT_ID="9e677b2b60b017835bca23b3267cd224.access"
export FLINK_CLIENT_SECRET="9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559"
export ELASTIC_USERNAME="sayyidyofa"
export ELASTIC_PASSWORD="Pi@rgen8"
export REDIS_URL="redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394"
export S3_ENDPOINT="https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com"
export S3_ACCESS_KEY_ID="e6cf9886c1fb510ce1f5afd212cd7c07"
export S3_SECRET_ACCESS_KEY="6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838"
export REDPANDA_BROKERS="d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092"
export REDPANDA_USERNAME="bongko"
export REDPANDA_PASSWORD="P@ssw0rd"
```

### 2. Deploy using the script

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy everything
./scripts/deploy.sh
```

### 3. Access the application

```bash
# Get service URLs
kubectl get services -n sayyidyofa-dev

# Watch pods starting
kubectl get pods -n sayyidyofa-dev -w
```

## Architecture

### Container Images

Two containers are built and deployed:

1. **molen-api** (Backend)
   - Based on `oven/bun:1-alpine`
   - Runs Bun/ElysiaJS API server
   - Port: 3000
   - Health check: `/health`

2. **molen-ui** (Frontend)
   - Based on `nginx:alpine`
   - Serves React/Vite SPA
   - Port: 8080
   - Health check: `/health`

### Kubernetes Resources

```
molen/
├── namespace.yaml          # Namespace: molen
├── configmap.yaml          # Non-sensitive configuration
├── secret.yaml.template    # Sensitive credentials (template)
├── api-deployment.yaml     # API deployment (2 replicas)
├── api-service.yaml        # API service (ClusterIP)
├── ui-deployment.yaml      # UI deployment (2 replicas)
└── ui-service.yaml         # UI service (LoadBalancer)
```

### Resource Allocation

**API Pods:**
- Requests: 100m CPU, 256Mi RAM
- Limits: 500m CPU, 512Mi RAM
- Replicas: 2 (for HA)

**UI Pods:**
- Requests: 50m CPU, 128Mi RAM
- Limits: 200m CPU, 256Mi RAM
- Replicas: 2 (for HA)

## Configuration

### ConfigMap (Non-Sensitive)

Stored in `k8s/configmap.yaml`:
- `NODE_ENV`: production
- `USE_MOCKS`: false (use real services)
- `SHADOW_MODE_ENABLED`: true
- Service URLs (non-sensitive parts)
- Logging configuration

### Secrets (Sensitive)

Stored in Kubernetes Secret `molen-secrets`:
- Flink credentials
- Elasticsearch credentials
- Redis connection URL
- S3/R2 credentials
- Redpanda credentials

**Never commit secrets to git!** Use the template and create secrets via kubectl or GitHub Secrets.

## Deployment Steps

### Manual Deployment

#### Step 1: Configure kubectl

```bash
kubectl config set-cluster openshift \
  --server=$KUBE_API_URL \
  --insecure-skip-tls-verify=true

kubectl config set-credentials deployer \
  --token=$KUBE_SERVICE_TOKEN

kubectl config set-context openshift \
  --cluster=openshift \
  --user=deployer \
  --namespace=$KUBE_NAMESPACE

kubectl config use-context openshift
```

#### Step 2: Create namespace

```bash
kubectl create namespace molen
# Or use existing namespace
kubectl create namespace $KUBE_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
```

#### Step 3: Create secrets

```bash
# Use the helper script
./scripts/create-secrets.sh $KUBE_NAMESPACE

# Or manually
kubectl create secret generic molen-secrets \
  --namespace=$KUBE_NAMESPACE \
  --from-literal=FLINK_CLIENT_ID="$FLINK_CLIENT_ID" \
  --from-literal=FLINK_CLIENT_SECRET="$FLINK_CLIENT_SECRET" \
  # ... (see secret.yaml.template for all fields)
```

#### Step 4: Deploy ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml -n $KUBE_NAMESPACE
```

#### Step 5: Deploy API

```bash
kubectl apply -f k8s/api-deployment.yaml -n $KUBE_NAMESPACE
kubectl apply -f k8s/api-service.yaml -n $KUBE_NAMESPACE

# Wait for rollout
kubectl rollout status deployment/molen-api -n $KUBE_NAMESPACE
```

#### Step 6: Deploy UI

```bash
kubectl apply -f k8s/ui-deployment.yaml -n $KUBE_NAMESPACE
kubectl apply -f k8s/ui-service.yaml -n $KUBE_NAMESPACE

# Wait for rollout
kubectl rollout status deployment/molen-ui -n $KUBE_NAMESPACE
```

### CI/CD Deployment (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically:
1. Builds Docker images
2. Pushes to GHCR (GitHub Container Registry)
3. Deploys to Kubernetes

#### Required GitHub Secrets

Add these to your repository Settings → Secrets:

**Kubernetes Access:**
- `KUBE_API_URL`: https://api.rm1.0a51.p1.openshiftapps.com:6443
- `KUBE_SERVICE_TOKEN`: <your-service-account-token>
- `KUBE_NAMESPACE`: sayyidyofa-dev

**Application Credentials:**
- `FLINK_CLIENT_ID`
- `FLINK_CLIENT_SECRET`
- `ELASTIC_USERNAME`
- `ELASTIC_PASSWORD`
- `REDIS_URL`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `REDPANDA_BROKERS`
- `REDPANDA_USERNAME`
- `REDPANDA_PASSWORD`

#### Trigger Deployment

```bash
# Push to main branch
git push origin main

# Or manually trigger in GitHub Actions UI
```

## Monitoring

### Check Deployment Status

```bash
# View all resources
kubectl get all -n $KUBE_NAMESPACE

# View pods
kubectl get pods -n $KUBE_NAMESPACE

# View services
kubectl get services -n $KUBE_NAMESPACE

# View deployments
kubectl get deployments -n $KUBE_NAMESPACE
```

### View Logs

```bash
# API logs
kubectl logs -f deployment/molen-api -n $KUBE_NAMESPACE

# UI logs
kubectl logs -f deployment/molen-ui -n $KUBE_NAMESPACE

# Specific pod
kubectl logs -f <pod-name> -n $KUBE_NAMESPACE

# Previous container (if crashed)
kubectl logs <pod-name> -n $KUBE_NAMESPACE --previous
```

### Describe Resources

```bash
# Describe pod (shows events)
kubectl describe pod <pod-name> -n $KUBE_NAMESPACE

# Describe deployment
kubectl describe deployment molen-api -n $KUBE_NAMESPACE

# Describe service
kubectl describe service molen-ui -n $KUBE_NAMESPACE
```

### Execute Commands in Pod

```bash
# Get shell in API pod
kubectl exec -it deployment/molen-api -n $KUBE_NAMESPACE -- /bin/sh

# Run specific command
kubectl exec deployment/molen-api -n $KUBE_NAMESPACE -- bun --version
```

### Health Checks

```bash
# API health
kubectl port-forward service/molen-api 3000:3000 -n $KUBE_NAMESPACE
curl http://localhost:3000/health

# UI health
kubectl port-forward service/molen-ui 8080:80 -n $KUBE_NAMESPACE
curl http://localhost:8080/health
```

## Troubleshooting

### Pods Not Starting

**Check pod status:**
```bash
kubectl get pods -n $KUBE_NAMESPACE
kubectl describe pod <pod-name> -n $KUBE_NAMESPACE
```

**Common issues:**
- Image pull errors: Check GHCR permissions
- Secret not found: Ensure `molen-secrets` exists
- Resource constraints: Check node resources

### Secrets Not Available

```bash
# Check if secret exists
kubectl get secret molen-secrets -n $KUBE_NAMESPACE

# View secret keys (not values)
kubectl describe secret molen-secrets -n $KUBE_NAMESPACE

# Recreate secret
./scripts/create-secrets.sh $KUBE_NAMESPACE
```

### Service Not Accessible

```bash
# Check service
kubectl get service molen-ui -n $KUBE_NAMESPACE

# Check endpoints
kubectl get endpoints molen-ui -n $KUBE_NAMESPACE

# Port forward for testing
kubectl port-forward service/molen-ui 8080:80 -n $KUBE_NAMESPACE
```

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n $KUBE_NAMESPACE

# For private GHCR, create image pull secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USER \
  --docker-password=$GITHUB_TOKEN \
  -n $KUBE_NAMESPACE
```

### Rolling Back Deployment

```bash
# View revision history
kubectl rollout history deployment/molen-api -n $KUBE_NAMESPACE

# Rollback to previous
kubectl rollout undo deployment/molen-api -n $KUBE_NAMESPACE

# Rollback to specific revision
kubectl rollout undo deployment/molen-api --to-revision=2 -n $KUBE_NAMESPACE
```

### Scaling

```bash
# Scale up
kubectl scale deployment molen-api --replicas=3 -n $KUBE_NAMESPACE

# Scale down
kubectl scale deployment molen-api --replicas=1 -n $KUBE_NAMESPACE

# Autoscaling (if HPA is configured)
kubectl autoscale deployment molen-api --min=2 --max=5 --cpu-percent=80 -n $KUBE_NAMESPACE
```

### Restart Deployment

```bash
# Restart without changing configuration
kubectl rollout restart deployment/molen-api -n $KUBE_NAMESPACE
kubectl rollout restart deployment/molen-ui -n $KUBE_NAMESPACE
```

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.gitignore` for `.env` files
   - Use Kubernetes Secrets for credentials
   - Use GitHub Secrets for CI/CD

2. **Use non-root containers**
   - Dockerfiles use `USER 1001`
   - Security context enforces non-root

3. **Read-only root filesystem** (optional)
   - Can be enabled in deployment specs
   - Requires temp directories to be volumes

4. **Network policies** (recommended)
   - Restrict pod-to-pod communication
   - Allow only necessary egress

5. **RBAC** (Role-Based Access Control)
   - Use service accounts with minimal permissions
   - Don't use cluster-admin unless necessary

## Performance Tuning

### Resource Limits

Adjust based on your workload:

```yaml
resources:
  requests:
    cpu: 200m      # Guaranteed CPU
    memory: 512Mi  # Guaranteed RAM
  limits:
    cpu: 1000m     # Max CPU
    memory: 1Gi    # Max RAM
```

### Horizontal Pod Autoscaling

```bash
kubectl autoscale deployment molen-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n $KUBE_NAMESPACE
```

### Persistent Volumes

For stateful data (if needed):

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: molen-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Next Steps

1. **Set up monitoring**
   - Prometheus for metrics
   - Grafana for dashboards
   - Alertmanager for alerts

2. **Configure Ingress**
   - Use Ingress controller for custom domains
   - Enable TLS/SSL with cert-manager

3. **Set up CI/CD**
   - Complete GitHub Actions workflow
   - Add testing stages
   - Implement canary deployments

4. **Database integration**
   - Deploy PostgreSQL for metadata
   - Use managed database service

5. **Backup and disaster recovery**
   - Regular backups of Secrets and ConfigMaps
   - Database backup strategy
   - Documented recovery procedures

## Support

For issues or questions:
- Check [SELF_SERVICE_ARCHITECTURE.md](../SELF_SERVICE_ARCHITECTURE.md)
- Review [PROJECT_COMPLETION_REPORT.md](../PROJECT_COMPLETION_REPORT.md)
- See [REDPANDA_INTEGRATION_GUIDE.md](../REDPANDA_INTEGRATION_GUIDE.md)
