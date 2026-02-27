import { FileText, Activity, CheckCircle } from 'lucide-react';

interface TabProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  darkMode?: boolean;
}

function Tab({ icon, label, active, disabled, darkMode }: TabProps) {
  return (
    <button 
      className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
        active 
          ? darkMode ? 'border-gray-100 text-gray-100' : 'border-gray-900 text-gray-900'
          : disabled
          ? darkMode ? 'border-transparent text-gray-700 cursor-not-allowed' : 'border-transparent text-gray-300 cursor-not-allowed'
          : darkMode ? 'border-transparent text-gray-400 hover:text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      disabled={disabled}
    >
      <span className="size-4">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

interface VisitTabsProps {
  darkMode: boolean;
}

export function VisitTabs({ darkMode }: VisitTabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b ${
      darkMode 
        ? 'border-gray-700 bg-gray-900' 
        : 'border-gray-200 bg-white'
    } px-6`}>
      <Tab icon={<FileText className="size-4" />} label="Pre-Visit" darkMode={darkMode} />
      <Tab icon={<Activity className="size-4" />} label="During Visit" active darkMode={darkMode} />
      <Tab icon={<CheckCircle className="size-4" />} label="Post-Visit" disabled darkMode={darkMode} />
    </div>
  );
}