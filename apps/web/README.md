# Project Molen

> **Enterprise Fraud-Ops Internal Developer Platform**  
> A type-safe, visually enforced data orchestration system for fraud detection and prevention

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Visual Design System](#visual-design-system)
- [Deployment Pipeline](#deployment-pipeline)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Project Molen** is an enterprise-grade internal developer platform (IDP) designed for fraud operations teams. It provides a powerful, type-safe orchestration layer that combines no-code visual building with pro-code flexibility, enabling fraud analysts and engineers to collaborate seamlessly on complex detection logic.

### What Makes Molen Different?

- **Type-Safe by Design**: Every connection, transformation, and rule is validated at authoring time
- **Bidirectional Sync**: Switch between visual blocks and code without losing context
- **Visual Type Enforcement**: Color-coded data flows make type mismatches impossible to miss
- **Production-Ready**: Built-in deployment pipeline with environment management and version control
- **Real-Time Engine**: Rust-based consumer processes events from Redpanda at scale

---

## ✨ Key Features

### 🧩 Modular Component System

- **Input Schemas**: JSON-only schemas with visual field explorer
- **Feature Extractors**: Type-aware data transformations with mandatory DataType fields
- **Typed Rules**: Stateless logic builder with type-aware operators and anomaly scoring
- **ML Models**: Integration layer for fraud detection models with dynamic score outputs
- **Orchestrators**: Visual graph-based workflow composer with N-ary aggregation nodes

### 🎨 Typed Logic Orchestrator

The heart of Molen is the **Orchestrator Canvas**, which provides:

- **Drag-and-Drop Palette**: Pre-configured nodes from your registry (Extractors, Rules, Models)
- **Visual Type Validation**: Invalid connections flash red with descriptive error messages
- **Real-Time Scoring**: Test runs simulate the full pipeline with mock transaction data
- **Aggregator Library**: Math (SUM/MAX/MIN/AVG) and Logic (AND/OR) operators for score composition
- **Properties Panel**: Contextual configuration for selected nodes with live validation feedback

### 🚀 Deployment Management

Separate authoring from deployment with a dedicated **Release Manager**:

- **Environment Cards**: Live status for Development, Staging, and Production
- **Version History**: Immutable snapshots with commit messages and author tracking
- **Promotion Workflow**: Deploy specific versions to specific environments
- **Redpanda Integration**: Configure inbound/outbound topics per deployment
- **Zero-Downtime Deploys**: Hot-swap orchestrator logic via Rust engine control topic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Visual    │  │     Code     │  │   Deployment     │  │
│  │   Builder   │◄─┤    Editor    │  │     Manager      │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ GraphQL / REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Control Plane (API Layer)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Schema Registry │ Version Store │ Deployment API  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Redpanda Control Topic
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Plane (Rust Event Processor)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Inbound    │  │ Orchestrator │  │   Outbound   │     │
│  │   Consumer   ├─►│    Engine    ├─►│   Producer   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authoring**: Analysts build orchestrator graphs in the visual editor
2. **Versioning**: Graphs are committed as immutable versions (v1.0, v1.1, etc.)
3. **Deployment**: Versions are promoted to environments via Deployment Manager
4. **Runtime**: Rust engine consumes control messages and hot-swaps logic
5. **Processing**: Live transactions flow through the orchestrator pipeline
6. **Scoring**: Aggregated anomaly scores are written to outbound topics

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **React Router 7.13** - Client-side routing
- **XYFlow 12.10** - Visual graph editor
- **Tailwind CSS 4.1** - Utility-first styling
- **Shadcn UI** - High-quality component library
- **Vite 6.3** - Build tool and dev server
- **TypeScript 5.0+** - Type safety

### State Management
- **TanStack React Query v5** - Primary state management for server data
- **React Hooks** - Local component state
- **Custom Logic Helpers** - Pure business logic in `src/app/state/`

For a detailed guide on contributing to the web codebase, see our [Web Developer Guide](./DEVELOPER_GUIDE.md).

### Data Visualization
- **Recharts 2.15** - Charts and sparklines
- **Lucide React** - Icon system

### Design System
- **Radix UI** - Unstyled accessible primitives
- **Motion** - Animation library
- **Sonner** - Toast notifications

---

## 📁 Project Structure

```
project-molen/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── common/           # Shared components (DataTypeBadge, etc.)
│   │   │   ├── layout/           # Header, Sidebar, Logo
│   │   │   ├── orchestrator/     # Orchestrator-specific components
│   │   │   │   ├── FeatureExtractorNode.tsx
│   │   │   │   ├── RuleNode.tsx
│   │   │   │   ├── ModelNode.tsx
│   │   │   │   ├── AggregatorNode.tsx
│   │   │   │   ├── LogicAggregatorNode.tsx
│   │   │   │   ├── EnvironmentCard.tsx
│   │   │   │   ├── DeploymentModal.tsx
│   │   │   │   └── DeploymentsView.tsx
│   │   │   ├── ruleEngine/       # Rule builder components
│   │   │   └── ui/               # Shadcn UI components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TypeSafeInputSchemas.tsx
│   │   │   ├── FeatureExtractors.tsx
│   │   │   ├── TypedRules.tsx
│   │   │   ├── Models.tsx
│   │   │   ├── Orchestrator.tsx
│   │   │   └── OrchestratorEditor.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── state/               # Global state management
│   │   └── App.tsx              # Root component
│   └── styles/
│       ├── fonts.css            # Font imports
│       └── theme.css            # Design tokens
├── public/                      # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Bun** (preferred for monorepo consistency)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/project-molen.git
cd project-molen

# Install dependencies (at root)
bun install

# Start development server
bun dev:web
```

The application will be available at the URL shown in your terminal (typically a local development URL).

### Building for Production

```bash
# Create production build
bun run build

# Preview production build locally
bun run preview
```

---

## 💡 Core Concepts

### DataTypes

Molen enforces strict type safety across all data transformations. Every field, extractor output, and rule input has an explicit DataType:

| DataType | Color | Usage |
|----------|-------|-------|
| `NUMBER` | 🟢 Green | Numeric values (Float, Integer) |
| `STRING` | 🔵 Blue | Text and identifiers |
| `BOOLEAN` | 🟣 Purple | True/false flags |
| `GEO` | 🔷 Cyan | Geographic coordinates |
| `ANOMALY_SCORE` | 🟠 Orange | Risk scores (0-100) |

### The Molen Wrap

The signature visual pattern showing data flow containment:
- **Layered Cards**: Primary content on elevated card with border glow
- **Nested Sections**: Secondary info in inset cards with reduced opacity
- **Flow Indicators**: Gradient edges showing data transformation paths
- **Type Badges**: Small pills with DataType-specific colors

### Orchestrator Nodes

#### Feature Extractor Node
Extracts a field from the input JSON and emits a typed value.

```typescript
{
  type: "featureExtractor",
  data: {
    label: "Transaction Amount",
    path: "$.transaction.amount",
    outputType: "NUMBER"
  }
}
```

#### Rule Node
Evaluates a boolean condition and contributes an anomaly score if triggered.

```typescript
{
  type: "rule",
  data: {
    label: "High Value Check",
    condition: "amount > 10000",
    anomalyScore: 85
  }
}
```

#### Model Node
Invokes an ML model and outputs a dynamic anomaly score.

```typescript
{
  type: "model",
  data: {
    label: "XGBoost Fraud Detector",
    version: "v2.1.0",
    accuracy: 94.2
  }
}
```

#### Aggregator Node (Result Sink)
Terminal node that combines all upstream anomaly scores into a final risk assessment.

```typescript
{
  type: "aggregator",
  data: {
    method: "max", // "avg" | "max" | "sum_cap"
    aggregateScore: 0 // Computed at runtime
  }
}
```

#### Logic Aggregator Nodes
N-ary operators for composing intermediate logic:

- **Math**: `SUM`, `MAX`, `MIN`, `AVG` (accepts NUMBER, emits NUMBER)
- **Logic**: `AND`, `OR` (accepts BOOLEAN, emits BOOLEAN)

---

## 🎨 Visual Design System

### Color Palette

```css
/* Primary Gradients */
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
--accent-gradient: linear-gradient(135deg, #8b5cf6 0%, #c026d3 100%);

/* Background Layers */
--bg-base: #020617;        /* slate-950 */
--bg-card: #0f172a;        /* slate-900 */
--bg-sidebar: #1e293b40;   /* slate-800/25 */

/* Borders */
--border-base: #334155;    /* slate-700 */
--border-glow: #6366f140;  /* primary/25 */

/* Status Colors */
--success: #10b981;        /* emerald-500 */
--warning: #f59e0b;        /* amber-500 */
--danger: #ef4444;         /* red-500 */
--info: #06b6d4;          /* cyan-500 */
```

### Typography

- **Headings**: Inter, system-ui fallback
- **Body**: Inter, system-ui fallback
- **Code/Mono**: JetBrains Mono, Consolas, monospace fallback

### Component Patterns

#### Card Structure
```tsx
<Card className="border-primary/20 bg-card/40 backdrop-blur">
  <CardHeader className="border-b border-border/30">
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      Title
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Content */}
  </CardContent>
</Card>
```

#### Type Badge
```tsx
<Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10">
  NUMBER
</Badge>
```

---

## 🔄 Deployment Pipeline

### Version Control

Every orchestrator graph is version-controlled:

1. **Draft State**: Work-in-progress changes (unsaved)
2. **Commit Version**: Create immutable snapshot (e.g., v2.1)
3. **Version History**: Audit trail with author, timestamp, commit message

### Environment Promotion

```
Development  →  Staging  →  Production
   (v1.1)        (v2.0)       (v1.2)
```

Each environment can run a different version independently.

### Deployment Flow

```typescript
// 1. User selects version from history table
deployVersion({
  version: "v2.1",
  environment: "Production",
  topics: {
    inbound: "fraud-events-inbound",
    outbound: "fraud-events-outbound"
  }
});

// 2. Control message published to Redpanda
{
  "orchestrator_id": "high-value-check",
  "version": "v2.1",
  "graph": { /* serialized node/edge definitions */ }
}

// 3. Rust engine consumes message
// 4. Hot-swap orchestrator logic (zero downtime)
// 5. Health check confirms activation
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** following our coding standards
5. **Test thoroughly** in both visual and code modes
6. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
7. **Push to your fork**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** with a detailed description

### Development Workflow

```bash
# Start dev server with hot reload
bun dev:web

# Run type checking
bun run type-check

# Format code
bun run format

# Lint code
bun run lint
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Shadcn UI** for the exceptional component library
- **XYFlow** for the powerful graph visualization engine
- **Radix UI** for accessible primitives
- **Tailwind CSS** for the utility-first styling system

---

## 📞 Support

For questions, issues, or feature requests:

- **Issues**: [GitHub Issues](https://github.com/your-org/project-molen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/project-molen/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/project-molen/wiki)

---

**Built with ❤️ by the Fraud Ops Engineering Team**
