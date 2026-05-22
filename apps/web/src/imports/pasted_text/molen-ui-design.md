System Instruction:
Act as a Senior UI/UX Designer specialized in design systems for Enterprise B2B SaaS Internal Developer Platforms. Your goal is to design a complete, high-fidelity mock-up for Project Molen. This design must be 100% compatible with the Shadcn UI component library and grounded in Frontend-Driven Development patterns.

Part 1: Application Context (Project Molen)
1.1 What is Molen for?
Project Molen is a high-performance Fraud-Ops Internal Developer Platform (IDP) and data orchestrator designed explicitly for the FinTech industry. Its core mission is to bridge the strategic gap between Fraud Strategy Analysts and Engineering teams. Analysts can use the platform to visually design, test, and manage complex fraud detection logic that is then executed by a powerful Rust and Kafka backend with sub-30ms latency for real-time transactions.

1.2 Key Features to Expect in the UI:

Visual Data Orchestrator (Canvas): A robust canvas view for building complex fraud detection Directed Acyclic Graphs (DAGs).

Custom Functional Nodes: Specialized nodes representing "Feature Extractors," stateless "Rule Nodes," and machine learning "Model Nodes," each grounded in Shadcn Card primitives.

Rule Builder: Specialized interfaces for defining stateless logic gates (e.g., Amount > 5000 = BLOCK) with specific operators and actions (PASS, FLAG, BLOCK).

Model Registry & Metrics: A view for managing machine learning models, displaying status, required inputs, predicted outputs, and key metrics like Accuracy and False Positive Rate (FPR). Supports UI-guided or Notebook (mock code editor) training workflows.

Input Schemas & Feature Extractors: Views for defining raw data shapes (e.g., Stripe Webhook, ISO-8583) and mapping them to internal feature types.

Strict Edge Validation: In the Orchestrator, connections between nodes are strictly validated against data types, preventing analysts from connecting incompatible nodes in real-time.

Graph Evaluation (Testing): A "Test Run" feature on the canvas that allows sending a mock transaction through the visually designed graph to get a server-side inference result (e.g., PASS, FLAG, BLOCK).

1.3 User Expectations of the App:
Fraud Analysts expect a trustworthy, deterministic tool that empowers them to build and deploy sophisticated fraud strategies visually. The interface must provide clear, premium, and trustworthy feedback consistent with an enterprise-grade platform, ensuring that a designed graph can be reliably executed as high-performance code.

Part 2: Aesthetic & Theme Mapping
Aesthetic: Premium, engineering-first, reminiscent of highly technical platforms like Datadog or Snowflake.

Theme: Pure dark mode using a Slate/Navy background.

Molen Wrap Philosophy: Incorporate the "Pisang Molen" (wrapped core) concept through a distinct tech aesthetic. All design elements (nodes, forms, cards) must appear as segmented, sharp geometric shapes made of thin glowing lines that visually "wrap" around a central data core, suggestive of speed and high-throughput energy.

Design Tokens (Palette):

--primary: Indigo (#6366f1) for buttons and active edges.

--accent: Violet (#8b5cf6) and Electric Blue gradients for status indicators and data flow lines to emphasize speed and energy.

--card: Slate Dark (#020617 / Slate 950) for core component containers.

Typography: Modern, minimalist sans-serif (Inter style), using crisp Ghost White (#f8fafc) for all typography.

Part 3: Required Layout & Views (Enriched Features)
Fixed App Shell:

Header: Features the specific "Molen" logotype where the letter 'O' is a node/edge symbol, the abstract geometric 'M' made of interconnected nodes, user avatar SY, and a search bar.

Sidebar (Vertical Nav): Strict list: Dashboard, Input Schemas, Feature Extractors, Rules, Models, Orchestrator.

Registry Pages (Tables):

Utilize standard Shadcn Table components for listings (e.g., Input Schemas, Feature Extractors, Rules, ML Models).

Include entity-specific columns, filtering headers, and action buttons that open relevant Shadcn Dialog/Sheet. Define specific form states including loading indicators and success toasts. Ensure the Rule Table highlights specific actions (BLOCK/PASS) using relevant colors. The Model Table should prioritize displaying metrics like Accuracy and FPR.

Orchestrator Page (React Flow Canvas):

Full-height flex container with a subtle grid background area.

Feature standard <ReactFlow> canvas controls.

Use Shadcn Card components wrapped around customized nodes (Feature Extractor, Rule Node, Model Node) to render them on the React Flow canvas.

Nodes must feature clean input/output <Handle> components. Use neon indigo/violet gradients for edge connections, implying high-speed data flow.

Test Run Button: A distinct Button within a Shadcn Dialog that allows inputting a mock transaction and viewing the server result (e.g., PASS/FLAG/BLOCK).

Dynamic Properties Sidebar (Right): Collapsible panel using collapsible panels or standard form inputs to allow binding a selected node to backend data entities like specific rules or models. Show node state via a colored Badge.