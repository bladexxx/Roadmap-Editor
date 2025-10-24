/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

const exampleRoadmap = `
# FlowX: Deliverables Matrix (2025-2026)
## Key Deliverables by Annual Theme & Strategic Pillar

### Pillar: Core Platform & Architecture
### Pillar: Hybrid Cloud & Security
### Pillar: Observability
### Pillar: GenAI Integration

---

### Timeframe: 2025 - Q1 & Q2: FlowX Build-out
- **Core Platform & Architecture**: 
  - Publish FlowX Architecture White Paper
  - Publish FlowX Architecture Specification
- **Hybrid Cloud & Security**: 
  - Unified Security Framework Implemented: integration of Azure Key Vault for secret management
- **Observability**: 
  - Core Business Monitoring Dashboards & Alerting System

---

### Timeframe: 2025 - Q3 & Q4: AI Empowerment
- **Core Platform & Architecture**: 
  - FlowX EDA Infrastructure Go-Live: Production-grade, HA MQ&Edge Cluster, Centralized MQ
  - Comprehensive Business Process Migration
- **Hybrid Cloud & Security**: 
  - Hybrid Cloud Communication Link: The unified communication model between Edge (On-cloud) and Central (On-premise)
- **Observability**: 
  - Business Tracing System Go-Live
- **GenAI Integration**: 
  - Deliver Core AI Components

---

### Timeframe: 2026 - Q1 & Q2: FlowX Stabilization & "Flow as API"
- **Core Platform & Architecture**: 
  - Metabase Bot Integration, LARA Integration, JIRA DO/DP Integration.
  - Legacy Architecture decommissioned
  - "Flow as API" Service Catalog v1.0
- **Hybrid Cloud & Security**:
  - Security Audit & Hardening

---

### Timeframe: 2026 - Q3 & Q4: AIOps & Integrations
- **Hybrid Cloud & Security**: 
  - Hybrid Cloud Operations Runbook v1.0
- **Observability**: 
  - Full L1/L2 Monitoring Coverage
- **GenAI Integration**: 
  - FlowX AI Diagnostics
`;

interface StartScreenProps {
  onGenerate: (text: string) => void;
  initialText: string;
}

const StartScreen: React.FC<StartScreenProps> = ({ onGenerate, initialText }) => {
  const [text, setText] = useState(initialText || exampleRoadmap);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(text);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-center text-gray-100">Enter Your Roadmap Data</h2>
          <p className="text-center text-gray-400 mt-2">
            Paste your roadmap in Markdown format below. An example is pre-filled for you.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-96 bg-gray-900/70 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="Paste your roadmap here..."
            aria-label="Roadmap data input"
          />
          <button
            type="submit"
            className="w-full sm:w-auto self-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
          >
            Visualize Roadmap
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartScreen;