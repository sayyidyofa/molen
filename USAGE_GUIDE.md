# Usage Guide: Project Molen

This guide walks you through running the project and using its core features.

## 🏃 Running the Platform

Ensure you have Docker, Bun, and Rust installed.

### 1. Start Infrastructure
Boot the required services (Postgres, Redpanda, MinIO):
```bash
bun infra:up
```

### 2. Initialize the Database
Set up the schema and seed initial data:
```bash
bun db:init
bun db:seed
```

### 3. Start the Services
Open four terminal windows (or use a terminal multiplexer like `tmux`) to run the platform components:

*   **Terminal 1: Control Plane (API)**
    ```bash
    bun dev:api
    ```
*   **Terminal 2: Frontend (Web)**
    ```bash
    bun dev:web
    ```
*   **Terminal 3: Data Plane (Engine)**
    ```bash
    bun dev:engine
    ```

---

## 🎨 Feature Walkthrough

### 1. The Orchestrator Canvas
1.  Open your browser and navigate to `http://localhost:5173` (or the port Vite provides).
2.  Navigate to the **Orchestrator** tab.
3.  You will see the visual canvas. Here you can:
    *   **Add Nodes**: Drag and drop components from the sidebar onto the canvas:
        *   **Feature Extractors**: Transform raw input data (e.g., extracting "Amount" from a JSON payload).
        *   **Rules**: Apply boolean logic to features (e.g., `amount > 1000`).
        *   **ML Models**: Use advanced models to calculate anomaly scores.
        *   **Aggregators**: Combine multiple scores into a final decision.
    *   **Connect Nodes**: Draw edges between ports to define the data flow.
    *   **Configure**: Click on a node to edit its configuration (e.g., changing a rule's threshold or a model's weights).

### 2. Saving and Versioning
*   Click **Save Draft** to persist your current progress in the PostgreSQL database.
*   Click **Commit Version** to create an immutable snapshot of your graph. This is required before a graph can be deployed.

### 3. Promoting a Deployment
1.  Go to the **Deployments** view within the Orchestrator.
2.  Select a **Committed Version** from the dropdown.
3.  Select the target environment (e.g., `Development`).
4.  Click **Promote**.

**What happens under the hood?**
The API publishes the graph AST (JSON) to the `molen_control_dev` topic in Redpanda. The Rust Engine consumes this message and updates its in-memory execution logic instantly.

---

## 🔬 Verifying and Testing

### 1. Monitor the Engine
Check the terminal where `bun dev:engine` is running. You should see logs indicating it has received the new deployment:
```text
Control plane consumer started
Received deployment: Production
Updated graph: High Value Check
```

### 2. Send a Test Transaction
To simulate a transaction, produce a JSON message to the `molen_transactions_in` topic using `rpk` (Redpanda CLI):

```bash
echo '{"amount": 5000, "currency": "USD"}' | docker exec -i molen_redpanda rpk topic produce molen_transactions_in
```

### 3. Observe the Result
The Engine will process the transaction and log the result:
```text
Processing transaction...
Resulting Anomaly Score: 100.0
```

### 4. Redpanda Console
You can visually inspect topics and messages by visiting the Redpanda Console at:
`http://localhost:8080`

### 5. API Documentation (Swagger)
The API provides a built-in Swagger UI for exploring and testing endpoints manually:
`http://localhost:3000/swagger`

---

## 🧪 Testing

The platform includes automated End-to-End (E2E) tests to ensure data persistence and feature correctness across the entire stack.

### 1. API E2E Tests (Backend)
These tests verify the core business logic, database persistence, and API contracts for all entities (Schemas, Rules, Orchestrators, etc.).
```bash
bun test:api
```

### 2. UI E2E Tests (Frontend)
Powered by Playwright, these tests simulate user interactions in the browser.
```bash
bun test:web:install # Only needed once to download browsers
bun test:web
```
*Note: Requires Playwright browsers. The `test:web:install` command handles this for you.*

### 3. Run All E2E Tests
To run both backend and frontend tests in sequence:
```bash
bun test:e2e
```

---

## 🛠 Troubleshooting

*   **Port Conflicts**: Ensure ports 5432 (Postgres), 8080 (Redpanda Console), 9000/9001 (MinIO), 3000 (API), and 5173 (Web) are free.
*   **Database Connection**: If the API fails to start, verify `DATABASE_URL` in `.env` matches your Docker settings.
*   **Kafka Connectivity**: If the Engine doesn't receive updates, ensure Redpanda is healthy: `docker ps`.
*   **LAN Access**: If accessing from another machine:
    *   The browser will automatically try to connect to the API on port 3000 of the same host where the web UI is loaded.
    *   Ensure the host machine's firewall allows incoming connections on ports 5173 (Web) and 3000 (API).
    *   If you need to use a different API URL, set `VITE_API_URL` environment variable before running `bun dev:web`.
