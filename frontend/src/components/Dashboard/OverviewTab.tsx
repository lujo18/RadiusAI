import { FiZap, FiRefreshCw, FiCalendar, FiHeart, FiTrendingUp, FiCheckCircle, FiInstagram, FiPlay, FiSettings } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

interface OverviewTabProps {
  stats: {
    postsScheduled: number;
    totalEngagement: number;
    avgEngagementRate: number;
    topPerformer: string;
  };
  performanceData: any[];
  upcomingPosts: any[];
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export default function OverviewTab({ 
  stats, 
  performanceData, 
  upcomingPosts, 
  isGenerating, 
  setIsGenerating 
}: OverviewTabProps) {
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
