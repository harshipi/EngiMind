
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { OutputDisplay } from './components/OutputDisplay';
import { Dashboard } from './components/Dashboard';
import { TestCenter } from './components/TestCenter';
import { CareerHub } from './components/CareerHub';
import { GradeCenter } from './components/GradeCenter';
import { ResourceLibrary } from './components/ResourceLibrary';
import { Settings } from './components/Settings';
import { DailyDrill } from './components/DailyDrill';
import { VoiceAgent } from './components/VoiceAgent';
import { TimeTable } from './components/TimeTable';
import { ActivityHub } from './components/ActivityHub';

import { generateStudyMaterial } from './services/gemini';
import { InputType, LearningSession, UserSettings } from './types';
import { saveSession, getSettings, saveSettings } from './services/storage';
import { MessageCircle } from 'lucide-react';

type ViewState = 'input' | 'output' | 'dashboard' | 'tests' | 'career' | 'grades' | 'resources' | 'drill' | 'timetable' | 'activity';

function App() {
  const [view, setView] = useState<ViewState>('input');
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);

  // Apply Theme
  useEffect(() => {
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleSettingsSave = (newSettings: UserSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
  };

  const handleGenerate = async (type: InputType, content: string | any[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Prepare parts for Gemini
      let parts = [];
      if (Array.isArray(content)) {
          // Multi-file
          parts = content;
          parts.push({ text: "Merge these materials and create a comprehensive study guide." });
      } else {
          // Single text
          parts = [{ text: content }];
      }

      const result = await generateStudyMaterial(parts);
      
      const title = type === 'text' 
        ? (typeof content === 'string' ? content.split(' ').slice(0, 8).join(' ') + '...' : 'Merged Text Study')
        : `Merged Analysis - ${new Date().toLocaleTimeString()}`;

      const newSession: LearningSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: title,
        type: Array.isArray(content) && content.length > 1 ? 'mixed' : type,
        content: result,
        progress: { notesRead: false, summaryRead: false, practiceCompleted: false }
      };

      saveSession(newSession);
      setCurrentSession(newSession);
      setView('output');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setView('input');
    setError(null);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20 md:pb-0">
      <Navbar 
        onNavigate={setView} 
        currentView={view} 
        onOpenSettings={() => setShowSettings(true)} 
        settings={settings}
      />
      
      <Settings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings} 
        onSave={handleSettingsSave} 
      />
      
      <VoiceAgent isOpen={showVoiceAgent} onClose={() => setShowVoiceAgent(false)} />

      <main className="relative pt-6 pb-24 md:pb-0">
        {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 flex justify-between items-center rounded-2xl mx-6">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="font-bold">OK</button>
            </div>
        )}

        {view === 'input' && <InputSection onGenerate={handleGenerate} isProcessing={isProcessing} />}
        {view === 'output' && currentSession && <OutputDisplay session={currentSession} onReset={handleReset} />}
        {view === 'dashboard' && <Dashboard onSelectSession={(s) => { setCurrentSession(s); setView('output'); }} />}
        {view === 'drill' && <DailyDrill settings={settings} />}
        {view === 'tests' && <TestCenter settings={settings} />}
        {view === 'career' && <CareerHub settings={settings} />}
        {view === 'grades' && <GradeCenter />}
        {view === 'resources' && <ResourceLibrary />}
        {view === 'timetable' && <TimeTable />}
        {view === 'activity' && <ActivityHub />}
      </main>

      {/* Floating Voice Agent Button */}
      <button 
        onClick={() => setShowVoiceAgent(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 border-4 border-white dark:border-slate-800"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
}

export default App;
