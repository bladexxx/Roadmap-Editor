/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { RoadmapData } from '../services/geminiService';
import { PillarIcon, TimelineIcon, FullScreenIcon, ExitFullScreenIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

// A map of pillar IDs to colors for consistent coloring across views.
const PILLAR_COLORS: { [key: string]: { border: string; bg: string; dot: string } } = {
  p1: { border: 'border-blue-400', bg: 'bg-blue-900/50', dot: 'bg-blue-400' },
  p2: { border: 'border-green-400', bg: 'bg-green-900/50', dot: 'bg-green-400' },
  p3: { border: 'border-pink-400', bg: 'bg-pink-900/50', dot: 'bg-pink-400' },
  p4: { border: 'border-orange-400', bg: 'bg-orange-900/50', dot: 'bg-orange-400' },
  p5: { border: 'border-indigo-400', bg: 'bg-indigo-900/50', dot: 'bg-indigo-400' },
  p6: { border: 'border-teal-400', bg: 'bg-teal-900/50', dot: 'bg-teal-400' },
};

const getPillarColor = (index: number) => {
  const key = `p${(index % Object.keys(PILLAR_COLORS).length) + 1}`;
  return PILLAR_COLORS[key];
};

const EditableDeliverable: React.FC<{ text: string; onSave: (newText: string) => void }> = ({ text, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(text);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setEditText(text);
    }, [text]);

    const handleSave = () => {
        if (editText.trim() && editText.trim() !== text) {
            onSave(editText.trim());
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                        setEditText(text);
                        setIsEditing(false);
                    }
                }}
                className="w-full bg-transparent border-b border-blue-400 focus:outline-none"
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-gray-700/50 rounded px-1 -mx-1">
            {text}
        </span>
    );
};

const PillarView: React.FC<{ data: RoadmapData; onEdit: (timeframeId: string, pillarId: string, taskIndex: number, newText: string) => void }> = ({ data, onEdit }) => {
  return (
    <div className="flex-1 overflow-auto p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1">{data.title}</h2>
        <p className="text-gray-400 text-center mb-8">{data.subtitle}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.pillars.map((pillar, index) => (
                <div key={pillar.id} className="flex flex-col gap-6">
                    <h3 className={`text-lg font-bold p-3 rounded-lg flex items-center gap-2 ${getPillarColor(index).bg} border-l-4 ${getPillarColor(index).border}`}>
                        <span className={`w-3 h-3 rounded-full ${getPillarColor(index).dot}`}></span>
                        {pillar.name}
                    </h3>
                    <div className="flex flex-col gap-6">
                        {data.timeframes.map((timeframe) => {
                            const pillarDeliverables = timeframe.deliverables.find(d => d.pillarId === pillar.id);
                            if (!pillarDeliverables || pillarDeliverables.tasks.length === 0) return null;

                            return (
                                <div key={`${pillar.id}-${timeframe.id}`} className="bg-gray-800/60 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-300 mb-3">
                                        {timeframe.name}{' '}
                                        <span className="font-normal text-sm text-gray-400">({timeframe.date})</span>
                                    </h4>
                                    <ul className="list-disc list-inside text-gray-400 space-y-2">
                                        {pillarDeliverables.tasks.map((task, taskIndex) => (
                                            <li key={taskIndex}>
                                                <EditableDeliverable
                                                    text={task}
                                                    onSave={(newText) => onEdit(timeframe.id, pillar.id, taskIndex, newText)}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const HorizontalScrollBar: React.FC<{ scrollRef: React.RefObject<HTMLDivElement> }> = ({ scrollRef }) => {
    const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
    const observer = useRef<ResizeObserver | null>(null);

    const checkScrollability = () => {
        const el = scrollRef.current;
        if (el) {
            const canScrollLeft = el.scrollLeft > 1;
            const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
            setScrollState({ canScrollLeft, canScrollRight });
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkScrollability();
        el.addEventListener('scroll', checkScrollability);

        observer.current = new ResizeObserver(checkScrollability);
        observer.current.observe(el);
        
        // Also observe children
        Array.from(el.children).forEach(child => observer.current!.observe(child));

        return () => {
            el.removeEventListener('scroll', checkScrollability);
            observer.current?.disconnect();
        };
    }, [scrollRef]);

    const handleScroll = (direction: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    };

    return (
        <div className="flex items-center justify-center w-full px-4 pt-4">
            <button onClick={() => handleScroll('left')} disabled={!scrollState.canScrollLeft} className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 h-2 bg-gray-700/50 rounded-full mx-2 relative cursor-pointer">
                {/* Thumb would require complex logic, so we'll omit for now */}
            </div>
            <button onClick={() => handleScroll('right')} disabled={!scrollState.canScrollRight} className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const TimelineView: React.FC<{ data: RoadmapData; onEdit: (timeframeId: string, pillarId: string, taskIndex: number, newText: string) => void }> = ({ data, onEdit }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const timeframesWithPillars = useMemo(() => {
    return data.timeframes.map(timeframe => {
      const deliverablesByPillar = data.pillars.map((pillar, index) => {
        const pillarDeliverables = timeframe.deliverables.find(d => d.pillarId === pillar.id);
        if (!pillarDeliverables || pillarDeliverables.tasks.length === 0) return null;
        return {
          pillar,
          tasks: pillarDeliverables.tasks,
          color: getPillarColor(index)
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null);
      return { ...timeframe, deliverablesByPillar };
    });
  }, [data]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1">{data.title}</h2>
      <p className="text-gray-400 text-center mb-12">{data.subtitle}</p>

      <div className="flex-1 overflow-auto scrollbar-hide" ref={scrollRef}>
        <div className="relative min-w-full text-center">
          {/* Timeline axis line */}
          <div className="absolute top-16 left-0 right-0 h-0.5 bg-gray-600 mx-4"></div>

          <div className="inline-block text-left">
            <div className="flex items-start">
              {timeframesWithPillars.map((timeframe, index) => (
                <div key={timeframe.id} className="flex-shrink-0 relative px-4" style={{ width: '320px' }}>
                  {/* Top part: Date and Marker */}
                  <div className="relative h-16 w-full text-center">
                    <div className="absolute bottom-4 left-0 right-0 text-sm font-semibold text-gray-300 whitespace-nowrap">{timeframe.date}</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-200 rounded-full ring-4 ring-gray-900" style={{ transform: 'translate(-50%, 50%)' }}></div>
                  </div>
                  
                  {/* Content below timeline */}
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-center mb-4">{timeframe.name}</h3>
                    <div className="flex flex-col gap-4">
                      {timeframe.deliverablesByPillar.map(p => (
                        <div key={p.pillar.id} className={`p-3 rounded-lg ${p.color.bg} border-l-4 ${p.color.border}`}>
                          <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${p.color.dot}`}></span>
                            {p.pillar.name}
                          </h4>
                          <ul className="list-disc list-inside text-gray-400 space-y-1 pl-2 text-sm">
                            {p.tasks.map((task, taskIndex) => (
                              <li key={taskIndex}>
                                <EditableDeliverable
                                  text={task}
                                  onSave={(newText) => onEdit(timeframe.id, p.pillar.id, taskIndex, newText)}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <HorizontalScrollBar scrollRef={scrollRef} />
    </div>
  );
};

interface EditorCanvasProps {
  data: RoadmapData;
  onReset: () => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ data, onReset }) => {
  const [viewMode, setViewMode] = useState<'pillar' | 'timeline'>('pillar');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [localData, setLocalData] = useState<RoadmapData>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleEdit = (timeframeId: string, pillarId: string, taskIndex: number, newText: string) => {
    setLocalData(prevData => {
      const newData: RoadmapData = JSON.parse(JSON.stringify(prevData));
      const timeframe = newData.timeframes.find(t => t.id === timeframeId);
      if (timeframe) {
        let deliverable = timeframe.deliverables.find(d => d.pillarId === pillarId);
        if(!deliverable){
          deliverable = {pillarId, tasks: []};
          timeframe.deliverables.push(deliverable);
        }
        if (deliverable.tasks[taskIndex] !== undefined) {
          deliverable.tasks[taskIndex] = newText;
        }
      }
      return newData;
    });
  };
  
  const toggleFullScreen = () => {
    if (!canvasRef.current) return;
    if (!document.fullscreenElement) {
      canvasRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const ViewComponent = viewMode === 'pillar' ? PillarView : TimelineView;

  return (
    <div ref={canvasRef} className="flex-1 flex flex-col bg-gray-900 overflow-hidden w-full h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
            <PencilIcon className="w-4 h-4" />
            Edit Source
          </button>
           <span className="text-xs text-gray-500 italic hidden sm:inline">Click on any deliverable to edit it directly.</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-700 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('pillar')}
              className={`px-3 py-1.5 text-sm rounded ${viewMode === 'pillar' ? 'bg-gray-600 shadow' : 'opacity-70 hover:bg-gray-600/50'}`}
              aria-label="Pillar View"
              aria-pressed={viewMode === 'pillar'}
            >
              <PillarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-sm rounded ${viewMode === 'timeline' ? 'bg-gray-600 shadow' : 'opacity-70 hover:bg-gray-600/50'}`}
              aria-label="Timeline View"
              aria-pressed={viewMode === 'timeline'}
            >
              <TimelineIcon className="w-5 h-5" />
            </button>
          </div>
          <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-md" aria-label="Toggle Fullscreen">
            {isFullScreen ? <ExitFullScreenIcon className="w-5 h-5" /> : <FullScreenIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto">
        <ViewComponent data={localData} onEdit={handleEdit} />
      </div>
    </div>
  );
};


export default EditorCanvas;