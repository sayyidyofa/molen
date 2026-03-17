#!/bin/bash
set -e
echo "Waiting for Redpanda..."
sleep 10
echo "Creating Kafka topics..."
rpk topic create user-events --brokers=redpanda:9092 --partitions=3 --replicas=1
rpk topic create fraud-alerts --brokers=redpanda:9092 --partitions=3 --replicas=1
echo "Done!"
