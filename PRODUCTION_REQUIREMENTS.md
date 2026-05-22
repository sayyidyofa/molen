# Production Requirements

This document outlines the requirements for deploying Project Molen in a production environment.

## 🚀 Deployment Strategy

- **Control Plane (API)**: Deploy as a containerized service (Kubernetes/ECS). Requires a persistent PostgreSQL database.
- **Data Plane (Engine)**: Deploy as a stateless consumer group in Kubernetes. Scaling is achieved by increasing the number of replicas and Kafka partitions.
- **Frontend**: Deploy as static assets behind a CDN or Nginx.

## 📡 Infrastructure Requirements

### 1. Messaging (Kafka)
- **Topic Partitions**: `molen_transactions_in` should have at least 10 partitions for parallel processing.
- **Retention**: At least 7 days for historical auditing.
- **Redundancy**: 3x replication factor.

### 2. Database (PostgreSQL)
- **High Availability**: Use a managed RDS or Patroni cluster.
- **Backups**: Daily snapshots and PITR (Point-in-Time Recovery).

### 3. Object Storage (S3)
- Required for storing large ML model artifacts and historical graph snapshots.

## 📊 Monitoring & Observability

- **Metrics**: 
  - Engine: Throughput (TPS), Latency (P99), CPU/Mem usage.
  - API: Request rate, Error rate (5xx), DB connection pool.
- **Logging**: Structured JSON logs to a centralized system (ELK/Loki).
- **Tracing**: OpenTelemetry integration (planned) for end-to-end event tracing.

## 🔐 Security

- **Encryption**: TLS for all in-transit data (including Kafka and DB).
- **Authentication**: JWT-based auth for the API and Web UI.
- **RBAC**: Role-based access control for promoting graphs to production.
