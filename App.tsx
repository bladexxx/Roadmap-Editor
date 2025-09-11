/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { generateInfographic } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { PencilIcon, DownloadIcon, SparkleIcon } from './components/icons';

interface RoadmapData {
  title: string;
  subtitle: string;
  pillars: { id: string; name: string }[];
  timeframes: {
    id: string;
    title: string;
    deliverables: { [pillarId: string]: string[] };
  }[];
}

const initialRoadmapData: RoadmapData = {
  title: "FlowX: Deliverables Matrix (2025-2026)",
  subtitle: "Key Deliverables by Annual Theme & Strategic Pillar",
  pillars: [
    { id: 'p1', name: "Core Platform & Architecture" },
    { id: 'p2', name: "Hybrid Cloud & Security" },
    { id: 'p3', name: "Observability" },
    { id: 'p4', name: "GenAI Integration" },
  ],
  timeframes: [
    {
      id: 't1',
      title: "2025: FlowX Build-out, Migration & AI Empowerment",
      deliverables: {
        p1: [
          "FlowX EDA Infrastructure Go-Live: Production-grade, HA MQ&Edge Cluster, Central Cluster.",
          "Comprehensive Business Process Migration",
          "Publish FlowX Architecture White Paper",
          "Publish FlowX Architecture Specification",
          "Deliver FlowX Binary Installation Package & Automation deployment scripts",
        ],
        p2: [
          "Hybrid Cloud Communication Link: The secure communication model between Edge (Azure) and Central (On-premise)",
          "Unified Security Framework Implemented: Full integration of Azure Key Vault for secret management",
        ],
        p3: [
          "L1 Business Tracing System Go-Live",
          "Core Business Monitoring Dashboards & Alert System",
          "VMT Alert Based on L1 tracing",
        ],
        p4: [
          "Deliver Core AI Components",
          "Core AI Workers Go-Live",
        ],
      }
    },
    {
      id: 't2',
      title: "2026: FlowX Stabilization, AI Diagnostics & Flow As API",
      deliverables: {
        p1: [
          "Legacy Architecture Decommissioned",
          "Platform Performance Baselines Established",
          '"Flow as API" Service Catalog v1.0: At least 2-3 common Worker capabilities are exposed as standard internal API services via the P1 Gateway, complete with full API documentation.',
          "Metabase Bot Integration, LARA Integration, JIRA DO/DP Integration, Snowflakes Integration.",
        ],
        p2: [
          "Hybrid Cloud Operations Runbook v1.0 - work with Emir team",
          "Security Audit & Hardening",
        ],
        p3: [
          "Full L1/L2 Monitoring Coverage: Ensure all live processes are integrated with L1 business tracing and complete the rollout of L2 health monitoring for all critical components.",
        ],
        p4: [
          "FlowX AI Diagnostics",
          "FlowX AIOps",
        ],
      }
    }
  ]
};

const App: React.FC = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData>(initialRoadmapData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'image'>('form');

  const handleDataChange = <T extends keyof RoadmapData>(
    field: T,
    value: RoadmapData[T]
  ) => {
    setRoadmapData(prev => ({ ...prev, [field]: value }));
  };

  const handlePillarNameChange = (index: number, newName: string) => {
    const newPillars = [...roadmapData.pillars];
    newPillars[index].name = newName;
    handleDataChange('pillars', newPillars);
  };
  
  const handleTimeframeTitleChange = (index: number, newTitle: string) => {
    const newTimeframes = [...roadmapData.timeframes];
    newTimeframes[index].title = newTitle;
    handleDataChange('timeframes', newTimeframes);
  };

  const handleDeliverableChange = (timeframeId: string, pillarId: string, value: string) => {
    setRoadmapData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData)); // Deep copy
        const timeframe = newData.timeframes.find((t: any) => t.id === timeframeId);
        if (timeframe) {
            timeframe.deliverables[pillarId] = value.split('\n').filter(line => line.trim() !== '');
        }
        return newData;
    });
  };

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateInfographic(roadmapData);
      setGeneratedImageUrl(imageUrl);
      setView('image');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the infographic. ${errorMessage}`);
      console.error(err);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  }, [roadmapData]);

  const handleDownload = useCallback(() => {
    if (generatedImageUrl) {
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `roadmap-infographic-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }, [generatedImageUrl]);
  
  const renderForm = () => (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">Create Your Roadmap Infographic</h2>
            <p className="mt-2 text-lg text-gray-400">Enter your strategic data below. The AI will transform it into a professional visual.</p>
        </div>

        {error && (
           <div className="w-full text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex flex-col items-center gap-2">
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-4 rounded-lg text-sm transition-colors"
              >
                Dismiss
            </button>
          </div>
        )}

        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Main Title</label>
                    <input
                        id="title"
                        type="text"
                        value={roadmapData.title}
                        onChange={e => handleDataChange('title', e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-600 text-gray-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>
                <div>
                    <label htmlFor="subtitle" className="block text-sm font-medium text-gray-300 mb-1">Subtitle</label>
                    <input
                        id="subtitle"
                        type="text"
                        value={roadmapData.subtitle}
                        onChange={e => handleDataChange('subtitle', e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-600 text-gray-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-separate" style={{borderSpacing: '1rem'}}>
                    <thead>
                        <tr>
                            <th className="text-left text-lg font-semibold text-gray-300 w-1/4">Strategic Pillar</th>
                            {roadmapData.timeframes.map((t, tIndex) => (
                                <th key={t.id} className="text-left text-lg font-semibold text-gray-300">
                                    <input
                                      type="text"
                                      value={t.title}
                                      onChange={e => handleTimeframeTitleChange(tIndex, e.target.value)}
                                      className="w-full bg-transparent text-gray-200 rounded-lg p-2 text-lg font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none transition focus:bg-gray-900/80"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {roadmapData.pillars.map((p, pIndex) => (
                            <tr key={p.id}>
                                <td className="align-top">
                                    <input
                                      type="text"
                                      value={p.name}
                                      onChange={e => handlePillarNameChange(pIndex, e.target.value)}
                                      className="w-full bg-transparent text-gray-200 rounded-lg p-2 text-base font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none transition focus:bg-gray-900/80"
                                    />
                                </td>
                                {roadmapData.timeframes.map(t => (
                                    <td key={t.id} className="align-top">
                                        <textarea
                                            value={t.deliverables[p.id]?.join('\n') || ''}
                                            onChange={(e) => handleDeliverableChange(t.id, p.id, e.target.value)}
                                            rows={6}
                                            className="w-full bg-gray-900/80 border border-gray-600 text-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                            placeholder="Enter deliverables, one per line..."
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-10 text-xl rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
            <SparkleIcon className="w-6 h-6 mr-3"/>
            Generate Infographic
        </button>
    </div>
  );

  const renderImage = () => (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-full bg-gray-800/80 border border-gray-700/80 rounded-lg p-2 flex items-center justify-center gap-2 backdrop-blur-sm">
            <button 
                onClick={() => setView('form')}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
            >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Data
            </button>
            <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base disabled:opacity-50"
            >
                <SparkleIcon className="w-5 h-5 mr-2" />
                Regenerate
            </button>
            <button 
                onClick={handleDownload}
                className="flex items-center justify-center ml-auto bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download
            </button>
        </div>

        <div className="w-full shadow-2xl rounded-xl overflow-hidden bg-black/20">
            {generatedImageUrl && (
                <img
                    src={generatedImageUrl}
                    alt="Generated Roadmap Infographic"
                    className="w-full h-auto object-contain rounded-xl"
                />
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow w-full mx-auto p-4 md:p-8 flex justify-center items-start">
        {isLoading && (
            <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <Spinner />
                <p className="text-gray-300 text-lg">AI is building your infographic...</p>
                <p className="text-gray-400 text-sm">This might take a moment.</p>
            </div>
        )}
        {view === 'form' ? renderForm() : renderImage()}
      </main>
    </div>
  );
};

export default App;
