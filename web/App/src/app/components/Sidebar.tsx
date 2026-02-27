import { 
  FileText, 
  Focus, 
  ClipboardList, 
  FileEdit, 
  Users, 
  FileCheck, 
  MessageSquare,
  CreditCard,
  LogOut
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  darkMode?: boolean;
}

function NavItem({ icon, label, active, badge, darkMode }: NavItemProps) {
  return (
    <button 
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative ${
        active 
          ? darkMode 
            ? 'bg-purple-900/30 text-purple-400 border-r-2 border-purple-500'
            : 'bg-purple-50 text-purple-700 border-r-2 border-purple-600'
          : darkMode
          ? 'text-gray-400 hover:bg-gray-800'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="size-5 flex-shrink-0">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {badge && (
        <span className={`ml-auto size-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
      )}
    </button>
  );
}

interface SidebarProps {
  darkMode: boolean;
}

export function Sidebar({ darkMode }: SidebarProps) {
  return (
    <aside className={`w-60 border-r flex flex-col h-full ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <nav className="flex-1 py-4">
        <NavItem icon={<FileText />} label="Transcript" active badge="1" darkMode={darkMode} />
        <NavItem icon={<Focus />} label="Clinical Focus" darkMode={darkMode} />
        <NavItem icon={<ClipboardList />} label="Clinical Fields" darkMode={darkMode} />
        <NavItem icon={<FileEdit />} label="Draft Note" darkMode={darkMode} />
        <NavItem icon={<Users />} label="Referrals" darkMode={darkMode} />
        <NavItem icon={<FileCheck />} label="Visit Summary" darkMode={darkMode} />
        <NavItem icon={<MessageSquare />} label="Ask" darkMode={darkMode} />
      </nav>
      
      <div className={`border-t py-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <NavItem icon={<CreditCard />} label="Checkout" darkMode={darkMode} />
        <NavItem icon={<LogOut />} label="Exit Encounter" darkMode={darkMode} />
      </div>
    </aside>
  );
}