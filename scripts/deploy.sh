#!/bin/bash
set -e

# Molen Kubernetes Deployment Script
# This script creates secrets and deploys the Molen application to Kubernetes

NAMESPACE="${KUBE_NAMESPACE:-sayyidyofa-dev}"
KUBE_API_URL="${KUBE_API_URL:-https://api.rm1.0a51.p1.openshiftapps.com:6443}"
KUBE_TOKEN="${KUBE_SERVICE_TOKEN}"

echo "🚀 Deploying Molen to Kubernetes"
echo "================================="
echo "Namespace: $NAMESPACE"
echo "API URL: $KUBE_API_URL"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Configure kubectl
echo "⚙️  Configuring kubectl..."
kubectl config set-cluster openshift \
    --server="$KUBE_API_URL" \
    --insecure-skip-tls-verify=true

kubectl config set-credentials deployer \
    --token="$KUBE_TOKEN"

kubectl config set-context openshift \
    --cluster=openshift \
    --user=deployer \
    --namespace="$NAMESPACE"

kubectl config use-context openshift

# Verify connection
echo "✅ Testing connection..."
kubectl cluster-info
echo ""

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo ""

# Create secrets (load from environment or prompt)
echo "🔐 Creating secrets..."
./scripts/create-secrets.sh "$NAMESPACE"
echo ""

# Apply ConfigMap
echo "⚙️  Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml --namespace="$NAMESPACE"
echo ""

# Deploy API
echo "🔧 Deploying API..."
kubectl apply -f k8s/api-deployment.yaml --namespace="$NAMESPACE"
kubectl apply -f k8s/api-service.yaml --namespace="$NAMESPACE"
echo ""

# Deploy UI
echo "🎨 Deploying UI..."
kubectl apply -f k8s/ui-deployment.yaml --namespace="$NAMESPACE"
kubectl apply -f k8s/ui-service.yaml --namespace="$NAMESPACE"
echo ""

# Wait for rollout
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/molen-api --namespace="$NAMESPACE" --timeout=5m
kubectl rollout status deployment/molen-ui --namespace="$NAMESPACE" --timeout=5m
echo ""

# Show deployment status
echo "📊 Deployment Status:"
echo "===================="
kubectl get deployments --namespace="$NAMESPACE"
echo ""
echo "Pods:"
kubectl get pods --namespace="$NAMESPACE"
echo ""
echo "Services:"
kubectl get services --namespace="$NAMESPACE"
echo ""

# Get service URLs
echo "🌐 Access URLs:"
echo "==============="
UI_SERVICE=$(kubectl get service molen-ui --namespace="$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
if [ "$UI_SERVICE" != "pending" ]; then
    echo "UI: http://$UI_SERVICE"
else
    echo "UI: LoadBalancer IP pending... Check with: kubectl get svc molen-ui -n $NAMESPACE"
fi

API_IP=$(kubectl get service molen-api --namespace="$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
echo "API (internal): http://$API_IP:3000"
echo ""

echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  - Monitor pods: kubectl get pods -n $NAMESPACE -w"
echo "  - View logs: kubectl logs -f deployment/molen-api -n $NAMESPACE"
echo "  - Access UI at the LoadBalancer IP (once assigned)"
