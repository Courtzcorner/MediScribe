import { AlignLeft, Mic } from 'lucide-react';

interface TranscriptPanelProps {
  darkMode: boolean;
}

export function TranscriptPanel({ darkMode }: TranscriptPanelProps) {
  return (
    <aside className={`w-80 border-l flex flex-col h-full ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <AlignLeft className="size-5" />
          <h3 className="font-semibold uppercase text-sm tracking-wide">Live Transcript</h3>
          <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>0 entries</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${
          darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
        }`}>
          <Mic className={`size-8 ${darkMode ? 'text-purple-500' : 'text-purple-400'}`} />
        </div>
        <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>No Transcript Yet</h4>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Transcript will appear here once recording starts.
        </p>
      </div>
      
      <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all">
          <div className="size-2 rounded-full bg-white animate-pulse"></div>
          Ready
        </button>
      </div>
    </aside>
  );
}