import { FiZap, FiCalendar, FiBarChart2, FiSettings, FiLogOut, FiTrendingUp, FiLayers } from 'react-icons/fi';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'calendar' | 'templates' | 'analytics' | 'style') => void;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6">
      <div className="flex items-center mb-8">
        <FiZap className="text-primary-500 text-3xl mr-2" />
        <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-pink-600 bg-clip-text text-transparent">
          SlideForge
        </span>
      </div>

      <nav className="space-y-2">
        <NavItem 
          icon={<FiBarChart2 />} 
          label="Overview" 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')} 
        />
        <NavItem 
          icon={<FiCalendar />} 
          label="Content Calendar" 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')} 
        />
        <NavItem 
          icon={<FiLayers />} 
          label="Templates" 
          active={activeTab === 'templates'} 
          onClick={() => setActiveTab('templates')} 
        />
        <NavItem 
          icon={<FiTrendingUp />} 
          label="A/B Testing" 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')} 
        />
        <NavItem 
          icon={<FiSettings />} 
          label="Settings" 
          active={activeTab === 'style'} 
          onClick={() => setActiveTab('style')} 
        />
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition ${
        active ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
