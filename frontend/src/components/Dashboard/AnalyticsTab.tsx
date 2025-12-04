import { useState } from 'react';
import { FiTrendingUp, FiRefreshCw, FiZap } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsTabProps {
  variantPerformance: any[];
  performanceData: any[];
}

export default function AnalyticsTab({ variantPerformance, performanceData }: AnalyticsTabProps) {
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
