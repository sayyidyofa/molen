/**
 * Main App Component
 */

import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './components/Builder/Canvas';
import { Sidebar } from './components/Builder/Sidebar';
import '@xyflow/react/dist/style.css';

function App() {
  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Molen</h1>
            <p className="text-sm text-gray-400">Fraud-Ops Platform</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Save
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
              Deploy
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ReactFlowProvider>
          <Canvas />
          <Sidebar />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default App;
