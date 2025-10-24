/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import EditorCanvas from './components/EditorCanvas';
import Spinner from './components/Spinner';
import { parseRoadmapText } from './services/geminiService';
import type { RoadmapData } from './services/geminiService';

function App() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [sourceText, setSourceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRoadmap = async (text: string) => {
    if (!text.trim()) {
      setError('Please paste some roadmap text.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRoadmapData(null);
    setSourceText(text); // Save source text for editing

    try {
      const data = await parseRoadmapText(text);
      setRoadmapData(data);
    } catch (e: any) {
      const message = e.message || 'An unknown error occurred.';
      setError(`Failed to generate roadmap. The AI model may have returned an invalid data structure. Please check the input format or try again. Details: ${message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditData = () => {
    setRoadmapData(null);
    setError(null);
    setIsLoading(false);
  };
  
  const handleTryAgain = () => {
    setError(null);
    setIsLoading(false);
    setRoadmapData(null);
    // sourceText is preserved so the user is back at the start screen with their text
  }


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Spinner />
          <p className="mt-4 text-lg text-gray-400">AI is architecting your roadmap...</p>
          <p className="text-sm text-gray-500">This may take a moment.</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-8 text-center">
          <p className="text-xl font-semibold mb-2">Oops! Something went wrong.</p>
          <p className="max-w-2xl text-red-300/80 mb-6">{error}</p>
          <button onClick={handleTryAgain} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    if (roadmapData) {
      return <EditorCanvas data={roadmapData} onReset={handleEditData} />;
    }
    return <StartScreen onGenerate={handleGenerateRoadmap} initialText={sourceText} />;
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 flex flex-col antialiased">
      <Header />
      <main className="flex-1 flex flex-col" style={{ ['--header-height' as any]: '64px', height: 'calc(100vh - var(--header-height))' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
