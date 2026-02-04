import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WaterfallMonitor } from './components/WaterfallMonitor';
import { RuleEditor } from './components/RuleEditor';
import { CaseTriage } from './components/CaseTriage';

/**
 * Main application component for Fraud-Ops Control Plane UI
 */
function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <header style={{ 
          backgroundColor: '#282c34', 
          padding: '20px', 
          color: 'white',
          marginBottom: '20px'
        }}>
          <h1>Fraud-Ops Control Plane</h1>
          <p>High-Performance Fraud Detection Orchestration System</p>
        </header>

        <nav style={{ 
          padding: '0 20px', 
          marginBottom: '20px',
          borderBottom: '2px solid #ddd',
          paddingBottom: '10px'
        }}>
          <Link to="/" style={{ marginRight: '20px', textDecoration: 'none' }}>
            Waterfall Monitor
          </Link>
          <Link to="/rules" style={{ marginRight: '20px', textDecoration: 'none' }}>
            Rule Editor
          </Link>
          <Link to="/triage" style={{ textDecoration: 'none' }}>
            Case Triage
          </Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<WaterfallMonitor />} />
            <Route path="/rules" element={<RuleEditor />} />
            <Route path="/triage" element={<CaseTriage />} />
          </Routes>
        </main>

        <footer style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: '#f5f5f5',
          textAlign: 'center'
        }}>
          <p>Fraud-Ops Control Plane v0.1.0 | Powered by Bun + ElysiaJS + React + Vite</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
