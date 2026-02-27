import { ArrowLeft, Activity, Mic, MicOff, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  return (
    <header className={`border-b px-6 py-4 ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className={darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}>
            <ArrowLeft className="size-5" />
          </button>
          <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dashboard</span>
          <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Activity className="size-4" />
            <span className="text-sm">Echo Health</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleDarkMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <div className="text-right">
            <select className={`text-sm border rounded-lg px-3 py-1.5 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-300' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}>
              <option>ROUTINE</option>
              <option>URGENT</option>
              <option>FOLLOW-UP</option>
            </select>
          </div>
          <button className={`text-sm border rounded-lg px-4 py-1.5 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-300' 
              : 'bg-white border-gray-300 text-gray-600'
          }`}>
            NEW PATIENT
          </button>
          <div className="text-right">
            <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Intake</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Laasya</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>New symptom evaluation</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isVoiceActive 
                ? darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isVoiceActive ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            Voice
          </button>
          <button className="bg-rose-300 hover:bg-rose-400 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all">
            <div className="size-5 rounded-full bg-white/30 flex items-center justify-center">
              <div className="size-2 rounded-full bg-white"></div>
            </div>
            End Encounter
          </button>
        </div>
      </div>
    </header>
  );
}