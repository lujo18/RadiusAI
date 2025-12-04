'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FiZap, FiCalendar, FiBarChart2, FiSettings, FiLogOut, FiTrendingUp, FiLayers, FiUser } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { logOut } from '@/lib/firebase/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logOut();
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      router.push('/');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: <FiBarChart2 />, label: 'Overview' },
    { path: '/dashboard/calendar', icon: <FiCalendar />, label: 'Content Calendar' },
    { path: '/dashboard/generate', icon: <FiZap />, label: 'Generate' },
    { path: '/dashboard/templates', icon: <FiLayers />, label: 'Templates' },
    { path: '/dashboard/profiles', icon: <FiUser />, label: 'Profiles' },
    { path: '/dashboard/analytics', icon: <FiTrendingUp />, label: 'A/B Testing' },
    { path: '/dashboard/settings', icon: <FiSettings />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 p-6 z-40">
        <div className="flex items-center mb-8">
          <FiZap className="text-primary-500 text-3xl mr-2" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-pink-600 bg-clip-text text-transparent">
            SlideForge
          </span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
