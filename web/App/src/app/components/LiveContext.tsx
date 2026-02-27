import { Activity, Sparkles, Stethoscope, FileText } from 'lucide-react';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  darkMode?: boolean;
}

function TabButton({ icon, label, active, darkMode }: TabButtonProps) {
  return (
    <button 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? darkMode 
            ? 'bg-purple-900/30 text-purple-400'
            : 'bg-purple-50 text-purple-700'
          : darkMode
          ? 'text-gray-400 hover:bg-gray-800'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="size-4">{icon}</span>
      {label}
    </button>
  );
}

interface LiveContextProps {
  darkMode: boolean;
}

export function LiveContext({ darkMode }: LiveContextProps) {
  return (
    <div className={`rounded-xl border p-6 min-h-[500px] ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Activity className="size-5" />
          <h2 className="font-semibold uppercase text-sm tracking-wide">Live Context</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
          <Sparkles className="size-4" />
          Generate Questions
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-6">
        <TabButton icon={<Sparkles className="size-4" />} label="Questions & Info Gaps" active darkMode={darkMode} />
        <TabButton icon={<Stethoscope className="size-4" />} label="DDx" darkMode={darkMode} />
        <TabButton icon={<FileText className="size-4" />} label="Notes" darkMode={darkMode} />
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <Sparkles className={`size-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        </div>
        <p className={`text-sm max-w-md ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Questions will appear as the conversation progresses. Start recording to get AI-suggested questions and identify information gaps.
        </p>
      </div>
    </div>
  );
}