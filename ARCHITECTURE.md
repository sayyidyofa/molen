# Fraud-Ops Control Plane - Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER (React/Vite)                     │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Waterfall      │  │  Rule Editor    │  │  Case Triage    │         │
│  │  Monitor        │  │  (REQ-3.2)      │  │  (REQ-3.3)      │         │
│  │  (REQ-3.1)      │  │                 │  │                 │         │
│  │  - Shadow Mode  │  │  - Thresholds   │  │  - Flagged Txns │         │
│  │  - Real-time    │  │  - Publish      │  │  - Investigation│         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                     │                   │
│           └────────────────────┼─────────────────────┘                   │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │ REST API
┌────────────────────────────────▼─────────────────────────────────────────┐
│                      API LAYER (Bun/ElysiaJS)                            │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Waterfall      │  │  Rule           │  │  Triage         │         │
│  │  Service        │  │  Service        │  │  Service        │         │
│  │  - Process Txn  │  │  - Get/Update   │  │  - Query Cases  │         │
│  │  - Shadow Mode  │  │  - Publish      │  │  - Case Details │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                     │                   │
│           └────────────────────┼─────────────────────┘                   │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────────────┐
│                       CORE LAYER (Business Logic)                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────┐           │
│  │              Interface Factory Pattern                    │           │
│  │                                                            │           │
│  │  ┌─────────────────────────────────────────────────────┐ │           │
│  │  │  ExternalClientFactory (REQ-2.1)                    │ │           │
│  │  │  - createElasticClient()                            │ │           │
│  │  │  - createRedisClient()                              │ │           │
│  │  │  - Environment-based switching (USE_MOCKS)          │ │           │
│  │  └─────────────────────────────────────────────────────┘ │           │
│  │                                                            │           │
│  │  ┌─────────────────────────────────────────────────────┐ │           │
│  │  │  RuleEvaluatorFactory (REQ-1.1)                     │ │           │
│  │  │  - createStatelessEvaluator()                       │ │           │
│  │  │  - createVelocityEvaluator()                        │ │           │
│  │  │  - createCombinedEvaluator()                        │ │           │
│  │  └─────────────────────────────────────────────────────┘ │           │
│  └──────────────────────────────────────────────────────────┘           │
│                                                                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │                │  │                │  │                │            │
│  │  Real  | Mock  │  │  Real  | Mock  │  │  Real  | Mock  │            │
│  │  (REQ-2.2)     │  │  (REQ-2.2)     │  │  (REQ-2.2)     │            │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │
│          │                   │                    │                     │
└──────────┼───────────────────┼────────────────────┼─────────────────────┘
           │                   │                    │
           │ SSL/TLS (REQ-2.3) │                    │
           │ CA_CERT_PATH      │                    │
           │                   │                    │
┌──────────▼───────────────────▼────────────────────▼─────────────────────┐
│                    EXTERNAL SERVICES LAYER                               │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ VM              │  │                 │  │                 │         │
│  │ - Alert Storage │  │  - Velocity     │  │  - Stream       │         │
│  │ - Case Search   │  │    State        │  │    Processing   │         │
│  │ (NFR-1.2: TLS)  │  │  - Counters     │  │  - Rule Exec    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ - Config        │  │  - Visualization│  │  - Rule Pub/Sub │         │
│  │ - Audit Logs    │  │  - Dashboards   │  │  - Event Stream │         │
│  │ (NFR-1.3)       │  │                 │  │                 │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │            Keycloak (OIDC Authentication)               │            │
│  │            Homelab-CA (SSL/TLS Verification)            │            │
│  └─────────────────────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────────────────────┘
```

## Waterfall Processing Flow

```
┌──────────────┐
│  UserEvent   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    Waterfall Pipeline                         │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Layer 1: Stateless Rule Evaluation                    │  │
│  │  - High Amount Check                                   │  │
│  │  - Suspicious Patterns                                 │  │
│  │  - Score: 0-50                                         │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│                        ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Layer 2: Velocity Rule Evaluation                     │  │
│  │  - Transaction Frequency (per minute)                  │  │
│  │  - Transaction Frequency (per hour)                    │  │
│  │  - Redis State Lookup                                  │  │
│  │  - Score: 0-70                                         │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│                        ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Layer 3: Aggregation & Decision                       │  │
│  │  - Total Score = Stateless + Velocity                  │  │
│  │  - Flagged if Total Score > 50                         │  │
│  └─────────────────────┬──────────────────────────────────┘  │
│                        │                                      │
│                        ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Layer 4: Logging & Response                           │  │
│  │  - Log to Elasticsearch (fraud-alerts index)           │  │
│  │  - If Shadow Mode: Allow transaction                   │  │
│  │  - If Active Mode: Block if flagged                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Shadow Mode Operation (REQ-1.2)

```
┌───────────────────────────────────────────────────────────┐
│                    Shadow Mode = OFF                       │
│                   (Active Detection)                       │
│                                                             │
│  Transaction → Evaluation → High Score?                    │
│                              │                             │
│                              ├─ YES → BLOCK Transaction    │
│                              │        Log to Elasticsearch │
│                              │                             │
│                              └─ NO  → ALLOW Transaction    │
│                                       Log to Elasticsearch │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                    Shadow Mode = ON                        │
│                   (Passive Monitoring)                     │
│                                                             │
│  Transaction → Evaluation → High Score?                    │
│                              │                             │
│                              ├─ YES → ALLOW Transaction    │
│                              │        Log to Elasticsearch │
│                              │        (Mark as Shadow)     │
│                              │                             │
│                              └─ NO  → ALLOW Transaction    │
│                                       Log to Elasticsearch │
│                                       (Mark as Shadow)     │
└───────────────────────────────────────────────────────────┘
```

## Interface Factory Pattern Implementation

```
┌─────────────────────────────────────────────────────────────┐
│              Interface Factory Pattern Flow                  │
│                                                               │
│  Application Code                                            │
│       │                                                       │
│       │ requests client                                      │
│       ▼                                                       │
│  ┌──────────────────────────────┐                           │
│  │  ExternalClientFactory       │                           │
│  │                              │                           │
│  │  if (USE_MOCKS === 'true')   │                           │
│  │    return MockClient         │                           │
│  │  else                        │                           │
│  │    return RealClient         │                           │
│  └──────────┬────────┬──────────┘                           │
│             │        │                                       │
│      Mock   │        │   Real                                │
│      Mode   │        │   Mode                                │
│             ▼        ▼                                       │
│  ┌───────────────┐  ┌───────────────┐                       │
│  │ MockElastic   │  │ RealElastic   │                       │
│  │ Client        │  │ Client        │                       │
│  │               │  │               │                       │
│  │ implements    │  │ implements    │                       │
│  │ IElasticClient│  │ IElasticClient│                       │
│  │               │  │               │                       │
│  │ - In-memory   │  │ - Real ES     │                       │
│  │   storage     │  │   connection  │                       │
│  │ - No network  │  │ - SSL/TLS     │                       │
│  │ - Fast tests  │  │ - Production  │                       │
│  └───────────────┘  └───────────────┘                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Package Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Package Structure                         │
│                                                               │
│  ┌────────────┐          ┌────────────┐                     │
│  │    api     │◄─────────│     ui     │                     │
│  │  (backend) │          │ (frontend) │                     │
│  └──────┬─────┘          └────────────┘                     │
│         │                                                    │
│         │ depends on                                         │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────┐                                             │
│  │    core    │                                             │
│  │ (business  │                                             │
│  │   logic)   │                                             │
│  └──────┬─────┘                                             │
│         │                                                    │
│         │ uses config from                                  │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────┐                                             │
│  │   config   │                                             │
│  │  (shared)  │                                             │
│  └────────────┘                                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow: Transaction Processing

```
1. User Event

   └─> Stream → Waterfall Service

3. API Receives Transaction
   └─> POST /waterfall/process
       └─> WaterfallService.processTransaction()

4. Rule Evaluation
   ├─> StatelessRuleEvaluator.evaluate()
   │   └─> Checks: Amount, Patterns
   │       └─> Returns: Score + Flags
   │
   └─> VelocityRuleEvaluator.evaluate()
       └─> Redis: Get transaction count
       └─> Checks: Frequency limits
       └─> Returns: Score + Flags

5. Aggregation
   └─> Total Score = Stateless + Velocity
   └─> Flagged = (Total Score > 50)

6. Persistence
   └─> ElasticsearchClient.index()
       └─> Index: fraud-alerts
       └─> Document: {
             transaction,
             results,
             totalScore,
             flagged,
             shadowMode,
             timestamp
           }

7. Response
   └─> If Shadow Mode: Always allow
   └─> If Active Mode: Block if flagged

8. Dashboard Updates
   └─> UI polls /triage/cases
   └─> Displays flagged transactions
   └─> Case Triage for investigation
```

## Security Architecture (NFR-1.2)

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Layers                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Transport Layer Security                           │ │
│  │     - Homelab-CA issued certificates                   │ │
│  │     - TLS 1.2+ for all external connections            │ │
│  │     - CA_CERT_PATH environment variable                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Authentication                                      │ │
│  │     - Keycloak OIDC integration (planned)              │ │
│  │     - JWT token validation                             │ │
│  │     - User ID tracking for audit logs                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Authorization                                       │ │
│  │     - Role-based access control (planned)              │ │
│  │     - Admin actions require specific permissions       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  4. Audit Logging (NFR-1.3)                            │ │
│  │     - All admin actions logged to Postgres             │ │
│  │     - Immutable audit trail                            │ │
│  │     - Authenticated user ID in all logs                │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
