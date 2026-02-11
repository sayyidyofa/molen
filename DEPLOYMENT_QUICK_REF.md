# Molen Kubernetes Deployment - Quick Reference

## Prerequisites

- kubectl installed
- Access to OpenShift cluster
- GitHub account with GHCR access

## Quick Deploy (3 Steps)

### 1. Set Environment Variables

```bash
# Kubernetes Cluster
export KUBE_API_URL="https://api.rm1.0a51.p1.openshiftapps.com:6443"
export KUBE_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6InZsU2VfaGN6MmRWNUg4elFnZWFWZEk3REM4RC1LVlZLMnZnTkhjYU9LMW8ifQ..."
export KUBE_NAMESPACE="sayyidyofa-dev"

# Flink
export FLINK_CLIENT_ID="9e677b2b60b017835bca23b3267cd224.access"
export FLINK_CLIENT_SECRET="9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559"

# Elasticsearch
export ELASTIC_USERNAME="sayyidyofa"
export ELASTIC_PASSWORD="Pi@rgen8"

# Redis
export REDIS_URL="redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394"

# S3/Cloudflare R2
export S3_ENDPOINT="https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com"
export S3_ACCESS_KEY_ID="e6cf9886c1fb510ce1f5afd212cd7c07"
export S3_SECRET_ACCESS_KEY="6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838"

# Redpanda
export REDPANDA_BROKERS="d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092"
export REDPANDA_USERNAME="bongko"
export REDPANDA_PASSWORD="P@ssw0rd"
```

### 2. Deploy

```bash
./scripts/deploy.sh
```

### 3. Verify

```bash
kubectl get pods -n sayyidyofa-dev
kubectl get services -n sayyidyofa-dev
```

## Common Commands

### Status Checks

```bash
# All resources
kubectl get all -n sayyidyofa-dev

# Pods
kubectl get pods -n sayyidyofa-dev

# Services
kubectl get services -n sayyidyofa-dev

# Deployments
kubectl get deployments -n sayyidyofa-dev
```

### Logs

```bash
# API logs
kubectl logs -f deployment/molen-api -n sayyidyofa-dev

# UI logs
kubectl logs -f deployment/molen-ui -n sayyidyofa-dev

# Specific pod
kubectl logs <pod-name> -n sayyidyofa-dev
```

### Health Checks

```bash
# Port forward API
kubectl port-forward service/molen-api 3000:3000 -n sayyidyofa-dev
curl http://localhost:3000/health

# Port forward UI
kubectl port-forward service/molen-ui 8080:80 -n sayyidyofa-dev
curl http://localhost:8080/health
```

### Debugging

```bash
# Describe pod
kubectl describe pod <pod-name> -n sayyidyofa-dev

# Get events
kubectl get events -n sayyidyofa-dev --sort-by='.lastTimestamp'

# Shell into pod
kubectl exec -it <pod-name> -n sayyidyofa-dev -- /bin/sh
```

### Updates

```bash
# Restart deployment
kubectl rollout restart deployment/molen-api -n sayyidyofa-dev

# Check rollout status
kubectl rollout status deployment/molen-api -n sayyidyofa-dev

# Rollback
kubectl rollout undo deployment/molen-api -n sayyidyofa-dev
```

### Scaling

```bash
# Scale up
kubectl scale deployment molen-api --replicas=3 -n sayyidyofa-dev

# Scale down
kubectl scale deployment molen-api --replicas=1 -n sayyidyofa-dev
```

## GitHub Actions (Automated)

### Add Secrets

Go to: Settings → Secrets and variables → Actions

**Add these 14 secrets:**

| Secret Name | Value |
|-------------|-------|
| KUBE_API_URL | https://api.rm1.0a51.p1.openshiftapps.com:6443 |
| KUBE_SERVICE_TOKEN | eyJhbGciOiJSUzI1NiIsImtpZCI6InZsU2VfaGN6... |
| KUBE_NAMESPACE | sayyidyofa-dev |
| FLINK_CLIENT_ID | 9e677b2b60b017835bca23b3267cd224.access |
| FLINK_CLIENT_SECRET | 9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559 |
| ELASTIC_USERNAME | sayyidyofa |
| ELASTIC_PASSWORD | Pi@rgen8 |
| REDIS_URL | redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@... |
| S3_ENDPOINT | https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com |
| S3_ACCESS_KEY_ID | e6cf9886c1fb510ce1f5afd212cd7c07 |
| S3_SECRET_ACCESS_KEY | 6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838 |
| REDPANDA_BROKERS | d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092 |
| REDPANDA_USERNAME | bongko |
| REDPANDA_PASSWORD | P@ssw0rd |

### Trigger Deploy

```bash
git push origin main
```

Or use GitHub Actions UI to manually trigger.

## Architecture

```
┌──────────────────────────────────────┐
│   GitHub Container Registry (ghcr.io) │
│   ghcr.io/sayyidyofa/molen-api:latest │
│   ghcr.io/sayyidyofa/molen-ui:latest  │
└──────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────┐
│  Kubernetes Cluster (OpenShift)       │
│  Namespace: sayyidyofa-dev            │
│                                        │
│  ┌─────────────────────────────────┐ │
│  │  API Deployment (2 replicas)    │ │
│  │  - Port 3000                     │ │
│  │  - /health endpoint              │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │  UI Deployment (2 replicas)     │ │
│  │  - Port 8080                     │ │
│  │  - /health endpoint              │ │
│  └─────────────────────────────────┘ │
│  ┌────────────┐  ┌────────────────┐ │
│  │ API Service│  │ UI Service     │ │
│  │ (ClusterIP)│  │ (LoadBalancer) │ │
│  └────────────┘  └────────────────┘ │
└──────────────────────────────────────┘
```

## Resources

- API: 100m-500m CPU, 256Mi-512Mi RAM (x2)
- UI: 50m-200m CPU, 128Mi-256Mi RAM (x2)
- Total: ~300m CPU, ~800Mi RAM

## Container Images

- API: `ghcr.io/sayyidyofa/molen-api:latest`
- UI: `ghcr.io/sayyidyofa/molen-ui:latest`

## Access URLs

```bash
# Get LoadBalancer IP
kubectl get service molen-ui -n sayyidyofa-dev

# Access UI
# http://<EXTERNAL-IP>

# API (internal)
# http://molen-api.sayyidyofa-dev.svc.cluster.local:3000
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n sayyidyofa-dev
kubectl logs <pod-name> -n sayyidyofa-dev
```

### Image pull errors
```bash
# Check image exists
docker pull ghcr.io/sayyidyofa/molen-api:latest

# Recreate deployment
kubectl delete deployment molen-api -n sayyidyofa-dev
kubectl apply -f k8s/api-deployment.yaml
```

### Secret not found
```bash
# Recreate secrets
./scripts/create-secrets.sh sayyidyofa-dev
```

### Service not accessible
```bash
# Port forward for testing
kubectl port-forward service/molen-ui 8080:80 -n sayyidyofa-dev
```

## Documentation

- **Full Guide:** k8s/README.md
- **Architecture:** SELF_SERVICE_ARCHITECTURE.md
- **Summary:** KUBERNETES_DEPLOYMENT_SUMMARY.md

## Demo

```bash
bun run demo.ts
```

Shows V2.0 features:
- Redpanda integration
- ML training workflow
- Shadow mode testing
- Model comparison
- S3 storage

## Support

For detailed information, see:
- k8s/README.md (deployment guide)
- KUBERNETES_DEPLOYMENT_SUMMARY.md (implementation)
- SELF_SERVICE_ARCHITECTURE.md (architecture)
