#!/bin/bash
set -e

# Script to create Kubernetes secrets for Molen
NAMESPACE="${1:-sayyidyofa-dev}"

echo "Creating secrets in namespace: $NAMESPACE"

# Check if secrets are set in environment
if [ -z "$# FLINK_CLIENT_ID" ] || [ -z "$ELASTIC_USERNAME" ]; then
    echo "⚠️  Credentials not found in environment variables."
    echo "Loading from .env file if it exists..."
    
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        echo "✅ Loaded from .env file"
    else
        echo "❌ No .env file found. Please set environment variables or create .env file."
        echo ""
        echo "Required variables:"
        echo "  - # FLINK_CLIENT_ID"
        echo "  - # FLINK_CLIENT_SECRET"
        echo "  - ELASTIC_USERNAME"
        echo "  - ELASTIC_PASSWORD"
        echo "  - REDIS_URL"
        echo "  - S3_ENDPOINT"
        echo "  - S3_ACCESS_KEY_ID"
        echo "  - S3_SECRET_ACCESS_KEY"
        echo "  - KAFKA_BROKERS"
        echo "  - KAFKA_USERNAME"
        echo "  - KAFKA_PASSWORD"
        exit 1
    fi
fi

# Create secret
kubectl create secret generic molen-secrets \
    --namespace="$NAMESPACE" \
    --from-literal=# FLINK_CLIENT_ID="${# FLINK_CLIENT_ID}" \
    --from-literal=# FLINK_CLIENT_SECRET="${# FLINK_CLIENT_SECRET}" \
    --from-literal=ELASTIC_USERNAME="${ELASTIC_USERNAME}" \
    --from-literal=ELASTIC_PASSWORD="${ELASTIC_PASSWORD}" \
    --from-literal=REDIS_URL="${REDIS_URL}" \
    --from-literal=S3_ENDPOINT="${S3_ENDPOINT}" \
    --from-literal=S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}" \
    --from-literal=S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}" \
    --from-literal=KAFKA_BROKERS="${KAFKA_BROKERS}" \
    --from-literal=KAFKA_USERNAME="${KAFKA_USERNAME}" \
    --from-literal=KAFKA_PASSWORD="${KAFKA_PASSWORD}" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets created/updated successfully"
