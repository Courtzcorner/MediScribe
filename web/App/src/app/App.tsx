import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { VisitTabs } from './components/VisitTabs';
import { LiveContext } from './components/LiveContext';
import { TreatmentPlan } from './components/TreatmentPlan';
import { TranscriptPanel } from './components/TranscriptPanel';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`size-full flex ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Sidebar darkMode={darkMode} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
        <VisitTabs darkMode={darkMode} />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <LiveContext darkMode={darkMode} />
            <TreatmentPlan darkMode={darkMode} />
          </div>
        </div>
      </div>
      
      <TranscriptPanel darkMode={darkMode} />
    </div>
  );
}