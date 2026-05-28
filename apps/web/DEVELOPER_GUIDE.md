# Molen Web Developer Guide

This guide is intended for developers with basic knowledge of React and state management who want to contribute to the Molen web application (`apps/web`).

## 🛠 Tech Stack Overview

- **Framework**: React 18.3.1 (Vite-based)
- **Routing**: React Router 7.13
- **State Management**: TanStack React Query v5 (Server State)
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Shadcn UI (Radix UI primitives)
- **Graph/Nodes**: XYFlow (@xyflow/react)
- **Icons**: Lucide React
- **Animations**: Motion (formerly framer-motion)

---

## 📁 Folder Structure

```text
apps/web/src/
├── app/
│   ├── components/       # Reusable UI elements
│   │   ├── ui/           # Shadcn base components
│   │   ├── layout/       # App-wide layout (Header, Sidebar)
│   │   ├── orchestrator/ # Orchestrator-specific components
│   │   └── forms/        # Feature-specific form components
│   ├── hooks/            # Custom React hooks
│   │   └── molen-api/    # API interaction hooks (React Query)
│   ├── pages/            # View components (one per route)
│   ├── state/            # Pure business logic and helpers
│   └── types/            # Frontend-specific TypeScript types
├── styles/               # Global CSS and Tailwind configuration
└── main.tsx              # Application entry point
```

---

## 🔄 State Management & API Interaction

Molen relies heavily on **TanStack React Query** for managing server state. We avoid global state libraries like Redux in favor of specialized hooks.

### 1. Fetching Data (useQuery)
All API calls are encapsulated in hooks within `src/app/hooks/molen-api/`.

```typescript
// Example: src/app/hooks/molen-api/rules.ts
export function useRules() {
  return useQuery<Rule[]>({
    queryKey: ['rules'],
    queryFn: () => fetch(`${API_BASE}/rules`).then(res => res.json()),
  });
}
```

### 2. Modifying Data (useMutation)
When changing data, use mutations and invalidate the relevant query keys to trigger a refresh.

```typescript
export function useAddRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: Omit<Rule, 'id'>) => 
      fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      }).then(res => res.json()),
    onSuccess: () => {
      // Invalidate to refresh the list
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
```

---

## 🚀 Adding a New Feature

To add a new feature (e.g., "Alerts"), follow these steps:

### 1. Define Types
If the type is shared with the backend, add it to `packages/shared-types`. If it's frontend-only, add it to `apps/web/src/app/types/`.

### 2. Create API Hooks
Create a new file in `src/app/hooks/molen-api/alerts.ts` and implement the necessary `useQuery` and `useMutation` hooks. Export them from `src/app/hooks/useMolenApi.ts`.

### 3. Build UI Components
Create small, reusable components in `src/app/components/alerts/`. Remember the **250 LOC limit** per file.

### 4. Create the Page
Create `src/app/pages/Alerts.tsx`. If the page logic is complex, move it to a custom hook like `useAlertsLogic.ts`.

### 5. Add Route
Register the new page in `src/app/App.tsx`.

---

## 🎨 UI & Styling Guidelines

### Shadcn UI
We use Shadcn UI. Before building a new component, check if a primitive already exists in `src/app/components/ui/`.

### The "Molen Wrap"
Molen uses a specific visual style for data cards:
- Use `Card` from `ui/card`.
- Apply `border-primary/20 bg-card/40 backdrop-blur` for a modern "glassmorphism" look.
- Use `DataTypeBadge` (in `common/`) to display data types with consistent colors.

### Type Colors
Consistency in colors for data types is crucial:
- **NUMBER**: Green
- **STRING**: Blue
- **BOOLEAN**: Purple
- **GEO**: Cyan
- **ANOMALY_SCORE**: Orange

---

## 🌍 Environment Variables

The web application uses the following environment variables:

- `VITE_API_URL`: The full URL to the backend API. 
  - *Default (if unset)*: `http://localhost:3000`

Variables must be prefixed with `VITE_` to be accessible in the frontend code via `import.meta.env`.

## 📏 Coding Standards

- **File Length**: Strictly keep files under **250 lines**. Split components if they grow too large.
- **Naming**: Use PascalCase for components (`MyComponent.tsx`) and camelCase for hooks (`useMyHook.ts`).
- **Props**: Always define an interface for component props.
- **Strict Typing**: Avoid `any`. Leverage the types from `@molen/shared-types`.
- **Forms**: Use `useState` for simple forms, or `react-hook-form` (via `src/app/components/ui/form.tsx`) for complex validation.

## 🧪 Testing

- **Component Tests**: Add tests using React Testing Library in a `__tests__` folder next to your component.
- **Logic Tests**: Pure logic in `src/app/state/` should be covered by unit tests.

---

## 🔗 Useful Links
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [XYFlow (React Flow) Docs](https://reactflow.dev/)
