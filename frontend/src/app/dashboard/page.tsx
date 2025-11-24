'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiZap, FiCalendar, FiBarChart2, FiSettings, FiLogOut, 
  FiTrendingUp, FiDownload, FiRefreshCw, FiPlay, FiPause,
  FiInstagram, FiClock, FiCheckCircle, FiEye, FiHeart,
  FiShare2, FiBookmark, FiLayers
} from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore, useDashboardStore, useAnalyticsStore, useStyleGuideStore } from '@/store';
import { logOut } from '@/lib/firebase/auth';
import { useTemplates, useCreateTemplate, useDeleteTemplate, usePosts } from '@/lib/api/hooks';
import TemplateCreator from '@/components/TemplateCreator';

export default function DashboardPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const isGenerating = useDashboardStore((state) => state.isGenerating);
  const setIsGenerating = useDashboardStore((state) => state.setIsGenerating);
  const stats = useDashboardStore((state) => state.stats);

  // Mock data - replace with actual API calls
  const mockStats = {
    postsScheduled: 98,
    totalEngagement: 34567,
    avgEngagementRate: 8.4,
    topPerformer: 'Variant B - 5 Slide Quotes',
  };

  const performanceData = [
    { day: 'Mon', impressions: 12400, engagement: 1240, saves: 450 },
    { day: 'Tue', impressions: 15600, engagement: 1560, saves: 580 },
    { day: 'Wed', impressions: 18900, engagement: 1890, saves: 720 },
    { day: 'Thu', impressions: 14200, engagement: 1420, saves: 510 },
    { day: 'Fri', impressions: 21300, engagement: 2130, saves: 890 },
    { day: 'Sat', impressions: 19800, engagement: 1980, saves: 750 },
    { day: 'Sun', impressions: 17500, engagement: 1750, saves: 640 },
  ];

  const variantPerformance = [
    { variant: 'A: 8-Slide List', posts: 14, avgSaves: 320, avgShares: 45 },
    { variant: 'B: 5-Slide Quotes', posts: 14, avgSaves: 680, avgShares: 92 },
    { variant: 'C: Story Format', posts: 14, avgSaves: 420, avgShares: 58 },
    { variant: 'D: Bold Questions', posts: 14, avgSaves: 510, avgShares: 71 },
  ];

  const upcomingPosts = [
    { id: 1, platform: 'Instagram', title: '10 Ways to Boost Your Morning Routine', time: '8:00 AM', date: 'Today', status: 'scheduled' },
    { id: 2, platform: 'TikTok', title: '5 Habits That Changed My Life', time: '12:00 PM', date: 'Today', status: 'scheduled' },
    { id: 3, platform: 'Instagram', title: 'The Truth About Productivity', time: '4:00 PM', date: 'Today', status: 'scheduled' },
    { id: 4, platform: 'TikTok', title: 'Stop Making These Mistakes', time: '8:00 PM', date: 'Today', status: 'scheduled' },
  ];

  const handleLogout = async () => {
    try {
      await logOut();
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Firebase logout fails
      logout();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* Sidebar */}
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
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats || mockStats} 
            performanceData={performanceData}
            upcomingPosts={upcomingPosts}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        )}
        {activeTab === 'calendar' && <CalendarTab upcomingPosts={upcomingPosts} />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'analytics' && <AnalyticsTab variantPerformance={variantPerformance} performanceData={performanceData} />}
        {activeTab === 'style' && <StyleGuideTab />}
      </main>
    </div>
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

function OverviewTab({ stats, performanceData, upcomingPosts, isGenerating, setIsGenerating }: any) {
  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation process
    setTimeout(() => setIsGenerating(false), 5000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your automated content pipeline</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <FiRefreshCw className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FiZap />
              Generate Week's Content
            </>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<FiCalendar className="text-primary-500" />}
          label="Posts Scheduled"
          value={stats.postsScheduled}
          subtitle="This week"
        />
        <StatCard 
          icon={<FiHeart className="text-red-500" />}
          label="Total Engagement"
          value={stats.totalEngagement.toLocaleString()}
          subtitle="+12.3% vs last week"
        />
        <StatCard 
          icon={<FiTrendingUp className="text-green-500" />}
          label="Avg Engagement Rate"
          value={`${stats.avgEngagementRate}%`}
          subtitle="+2.1% improvement"
        />
        <StatCard 
          icon={<FiCheckCircle className="text-blue-500" />}
          label="Top Performer"
          value={stats.topPerformer}
          subtitle="340% more saves"
        />
      </div>

      {/* Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Weekly Performance</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="impressions" stroke="#FF4F8B" strokeWidth={2} />
            <Line type="monotone" dataKey="engagement" stroke="#60A5FA" strokeWidth={2} />
            <Line type="monotone" dataKey="saves" stroke="#34D399" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming Posts */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Upcoming Posts</h2>
        <div className="space-y-4">
          {upcomingPosts.map((post: any) => (
            <div key={post.id} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${post.platform === 'Instagram' ? 'bg-pink-500/20' : 'bg-blue-500/20'}`}>
                  {post.platform === 'Instagram' ? (
                    <FiInstagram className="text-pink-500" />
                  ) : (
                    <FiPlay className="text-blue-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-400">{post.platform} • {post.date} at {post.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                  {post.status}
                </span>
                <button className="text-gray-400 hover:text-white">
                  <FiSettings />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarTab({ upcomingPosts }: any) {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Content Calendar</h1>
      
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">November 2025</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Previous</button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Next</button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 pb-2">{day}</div>
          ))}
          {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
            <div key={day} className="aspect-square bg-gray-900/50 rounded-lg p-2 hover:bg-gray-700 cursor-pointer">
              <div className="text-sm mb-1">{day}</div>
              {day % 7 !== 0 && (
                <div className="space-y-1">
                  <div className="text-xs bg-pink-500/20 text-pink-400 px-1 rounded">7 IG</div>
                  <div className="text-xs bg-blue-500/20 text-blue-400 px-1 rounded">7 TT</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">All Scheduled Posts</h2>
        <div className="space-y-3">
          {upcomingPosts.map((post: any) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ variantPerformance, performanceData }: any) {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Mock A/B tests
  const mockTests = [
    {
      id: '1',
      name: 'Week 47 - Hook Style Test',
      status: 'running',
      templates: ['Bold Questions', 'Minimal Quotes', 'Story Arc'],
      startDate: 'Nov 18, 2025',
      endDate: 'Nov 25, 2025',
      progress: 65,
      currentLeader: 'Minimal Quotes',
      postsPerTemplate: 14
    },
    {
      id: '2',
      name: 'Week 46 - CTA Variations',
      status: 'completed',
      templates: ['Save CTA', 'Follow CTA'],
      startDate: 'Nov 11, 2025',
      endDate: 'Nov 18, 2025',
      progress: 100,
      winner: 'Save CTA',
      confidenceScore: 0.94,
      improvement: '+42% saves'
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">A/B Testing</h1>
          <p className="text-gray-400">Compare template performance and optimize</p>
        </div>
        <button className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2">
          <FiTrendingUp />
          Create A/B Test
        </button>
      </div>

      {/* Active Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Tests</h2>
        <div className="space-y-4">
          {mockTests.filter(t => t.status === 'running').map((test) => (
            <div key={test.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{test.name}</h3>
                  <p className="text-sm text-gray-400">{test.startDate} - {test.endDate}</p>
                </div>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
                  Running
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-semibold">{test.progress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${test.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {test.templates.map((template, idx) => (
                  <div 
                    key={idx}
                    className={`bg-gray-900/50 border rounded-lg p-4 ${
                      template === test.currentLeader ? 'border-primary-500' : 'border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-2">{template}</div>
                    <div className="text-xs text-gray-400">{test.postsPerTemplate} posts</div>
                    {template === test.currentLeader && (
                      <div className="text-xs text-primary-400 mt-2">🏆 Current Leader</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Completed Tests</h2>
        <div className="space-y-4">
          {mockTests.filter(t => t.status === 'completed').map((test) => (
            <div key={test.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{test.name}</h3>
                  <p className="text-sm text-gray-400">{test.startDate} - {test.endDate}</p>
                </div>
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
                  Completed
                </span>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Winner</div>
                    <div className="text-2xl font-bold text-green-400">{test.winner}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Confidence: {(test.confidenceScore! * 100).toFixed(0)}% • {test.improvement}
                    </div>
                  </div>
                  <button className="bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 px-4 py-2 rounded-lg text-sm transition">
                    Apply Winner
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Performance Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Historical Performance</h2>
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg flex items-center gap-2">
            <FiRefreshCw />
            Refresh Data
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={variantPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="variant" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
            />
            <Legend />
            <Bar dataKey="avgSaves" fill="#FF4F8B" />
            <Bar dataKey="avgShares" fill="#60A5FA" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/50 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiZap className="text-primary-500" />
          AI Insights
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <FiTrendingUp className="text-green-500 mt-1" />
            <span>Variant B (5-slide quotes) is performing 340% better than baseline. Increasing allocation to 60%.</span>
          </li>
          <li className="flex items-start gap-3">
            <FiTrendingUp className="text-green-500 mt-1" />
            <span>Posts with question hooks get 2.3× more saves. Updated style guide to prioritize questions.</span>
          </li>
          <li className="flex items-start gap-3">
            <FiTrendingUp className="text-green-500 mt-1" />
            <span>Best posting times: 8 AM, 12 PM, 8 PM. Schedule optimized for next week.</span>
          </li>
        </ul>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <MetricCard title="Top Performing Posts" data={[
          { title: '5 Habits That Changed Everything', saves: 1240, engagement: 8.9 },
          { title: 'Stop Making These Mistakes', saves: 980, engagement: 7.2 },
          { title: 'The Truth About Success', saves: 850, engagement: 6.8 },
        ]} />
        <MetricCard title="Platform Breakdown" data={[
          { platform: 'Instagram', posts: 49, avgEngagement: 7.8 },
          { platform: 'TikTok', posts: 49, avgEngagement: 9.2 },
        ]} />
      </div>
    </div>
  );
}

function StyleGuideTab() {
  const styleGuide = useStyleGuideStore((state) => state.content);
  const setContent = useStyleGuideStore((state) => state.setContent);
  const saveContent = useStyleGuideStore((state) => state.saveContent);
  const resetToDefault = useStyleGuideStore((state) => state.resetToDefault);
  const isDirty = useStyleGuideStore((state) => state.isDirty);

  const handleSave = () => {
    saveContent(styleGuide);
    // TODO: Also save to backend API
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Master Style Guide</h1>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Brand Guidelines</h2>
        <p className="text-gray-400 mb-6">
          This style guide controls how all your carousels are generated. Edit it to match your brand voice and visual identity.
          {isDirty && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
        </p>
        
        <textarea
          value={styleGuide}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 min-h-[300px] focus:outline-none focus:border-primary-500 font-mono text-sm"
        />
        
        <div className="flex gap-4 mt-4">
          <button 
            onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold"
          >
            Save Changes
          </button>
          <button 
            onClick={resetToDefault}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            Reset to Default
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Quick Settings</h3>
          <div className="space-y-4">
            <Setting label="Carousel Length" value="8-10 slides" />
            <Setting label="Primary Font" value="Inter Bold" />
            <Setting label="Accent Color" value="#ff4f8b" />
            <Setting label="Background Style" value="Dark Gradient" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Connected Accounts</h3>
          <div className="space-y-4">
            <ConnectedAccount platform="Instagram" username="@yourhandle" status="Connected" />
            <ConnectedAccount platform="TikTok" username="@yourhandle" status="Connected" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle }: any) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{icon}</div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}

function PostRow({ post }: any) {
  return (
    <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <FiClock className="text-gray-400" />
        <span className="text-sm">{post.time}</span>
        <span className="text-sm text-gray-400">{post.platform}</span>
        <span className="text-sm">{post.title}</span>
      </div>
      <div className="flex gap-2">
        <button className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
        <button className="text-sm text-red-400 hover:text-red-300">Delete</button>
      </div>
    </div>
  );
}

function MetricCard({ title, data }: any) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm">{item.title || item.platform}</span>
            <span className="text-sm text-gray-400">
              {item.saves ? `${item.saves} saves` : `${item.posts} posts`} • {item.avgEngagement || item.engagement}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Setting({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ConnectedAccount({ platform, username, status }: any) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="font-semibold">{platform}</div>
        <div className="text-sm text-gray-400">{username}</div>
      </div>
      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
        {status}
      </span>
    </div>
  );
}

function TemplatesTab() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch templates from API
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  const handleSaveTemplate = async (template: any) => {
    try {
      console.log('Creating template:', template);
      const result = await createTemplateMutation.mutateAsync(template);
      console.log('Template created successfully:', result);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create template:', error);
      // Show error to user
      alert('Failed to create template. Please check the console for details.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplateMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Templates</h1>
          <p className="text-gray-400">Create and manage slide templates for A/B testing</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <FiLayers />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 gap-6">
        {templatesLoading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))
        ) : templates && templates.length > 0 ? (
          templates.map((template: any) => (
          <div 
            key={template.id}
            className={`bg-gray-800/50 border rounded-xl p-6 cursor-pointer transition hover:border-primary-500 ${
              template.isDefault ? 'border-primary-500' : 'border-gray-700'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                <span className="text-xs text-gray-400 uppercase">{template.category}</span>
              </div>
              {template.isDefault && (
                <span className="text-xs bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full">
                  Default
                </span>
              )}
              {template.status === 'testing' && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                  Testing
                </span>
              )}
            </div>

            {/* Performance Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Posts</span>
                <span className="font-semibold">{template.performance.totalPosts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Engagement</span>
                <span className="font-semibold text-green-400">{template.performance.avgEngagementRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Saves</span>
                <span className="font-semibold">{template.performance.avgSaves}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/template/${template.id}`);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(template.id);
                }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))
        ) : (
          // Empty state
          <div className="col-span-3 text-center py-12">
            <FiLayers className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No templates yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition"
            >
              Create Your First Template
            </button>
          </div>
        )}

        {/* Create New Card */}
        <div 
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-800/30 border border-dashed border-gray-600 rounded-xl p-6 cursor-pointer transition hover:border-primary-500 flex flex-col items-center justify-center min-h-[300px]"
        >
          <FiLayers className="text-6xl text-gray-600 mb-4" />
          <p className="text-gray-400 font-semibold">Create New Template</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-4 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-primary-400 mb-2">
            {templates?.filter((t: any) => t.status === 'active').length || 0}
          </div>
          <div className="text-sm text-gray-400">Active Templates</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {templates && templates.length > 0
              ? (templates.reduce((sum: number, t: any) => sum + t.performance.avgEngagementRate, 0) / templates.length).toFixed(1)
              : '0.0'}%
          </div>
          <div className="text-sm text-gray-400">Avg Engagement Rate</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {templates?.reduce((sum: number, t: any) => sum + t.performance.totalPosts, 0) || 0}
          </div>
          <div className="text-sm text-gray-400">Total Posts Generated</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {templates?.filter((t: any) => t.status === 'testing').length || 0}
          </div>
          <div className="text-sm text-gray-400">A/B Tests Running</div>
        </div>
      </div>

      {/* Template Creator Modal */}
      {showCreateModal && (
        <TemplateCreator 
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
}

