import { BrowserRouter, Routes, Route } from "react-router";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { InputSchemas } from "./pages/InputSchemas";
import { FeatureExtractors } from "./pages/FeatureExtractors";
import { Rules } from "./pages/Rules";
import { Models } from "./pages/Models";
import { Orchestrator } from "./pages/Orchestrator";
import { OrchestratorEditor } from "./pages/OrchestratorEditor";
import { Toaster } from "sonner";

export default function App() {
  return (
    <BrowserRouter>
      <div className="dark h-screen w-screen overflow-hidden bg-background text-foreground">
        <Header />
        <div className="flex h-[calc(100vh-3.5rem)]">
          <Sidebar />
          <Routes>
            <Route
              path="/"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <Dashboard />
                  </div>
                </main>
              }
            />
            <Route
              path="/input-schemas"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <InputSchemas />
                  </div>
                </main>
              }
            />
            <Route
              path="/feature-extractors"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <FeatureExtractors />
                  </div>
                </main>
              }
            />
            <Route
              path="/rules"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <Rules />
                  </div>
                </main>
              }
            />
            <Route
              path="/models"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <Models />
                  </div>
                </main>
              }
            />
            <Route
              path="/orchestrator"
              element={
                <main className="flex-1 ml-64 overflow-auto">
                  <div className="container max-w-screen-2xl p-6">
                    <Orchestrator />
                  </div>
                </main>
              }
            />
            <Route
              path="/orchestrator/:id/edit"
              element={
                <main className="flex-1 ml-64 h-full overflow-hidden">
                  <OrchestratorEditor />
                </main>
              }
            />
          </Routes>
        </div>
        <Toaster theme="dark" />
      </div>
    </BrowserRouter>
  );
}
