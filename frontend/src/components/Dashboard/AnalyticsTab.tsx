import React from "react";
import { useState } from 'react';
import { FiTrendingUp, FiRefreshCw, FiZap } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
        <Button>
          <FiTrendingUp />
          Create A/B Test
        </Button>
      </div>

      {/* Active Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Tests</h2>
        <div className="space-y-4">
          {mockTests.filter(t => t.status === 'running').map((test) => (
            <Card key={test.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{test.name}</h3>
                    <p className="text-sm text-muted-foreground">{test.startDate} - {test.endDate}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                    Running
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{test.progress}%</span>
                  </div>
                  <Progress value={test.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {test.templates.map((template, idx) => (
                    <Card 
                      key={idx}
                      className={template === test.currentLeader ? 'border-primary' : ''}
                    >
                      <CardContent className="pt-4">
                        <div className="text-sm font-semibold mb-2">{template}</div>
                        <div className="text-xs text-muted-foreground">{test.postsPerTemplate} posts</div>
                        {template === test.currentLeader && (
                          <div className="text-xs text-primary mt-2">🏆 Current Leader</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Completed Tests</h2>
        <div className="space-y-4">
          {mockTests.filter(t => t.status === 'completed').map((test) => (
            <Card key={test.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{test.name}</h3>
                    <p className="text-sm text-muted-foreground">{test.startDate} - {test.endDate}</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                    Completed
                  </Badge>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Winner</div>
                      <div className="text-2xl font-bold text-green-400">{test.winner}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Confidence: {(test.confidenceScore! * 100).toFixed(0)}% • {test.improvement}
                      </div>
                    </div>
                    <Button variant="secondary">
                      Apply Winner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Variant Performance Chart */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Historical Performance</CardTitle>
            <Button variant="default">
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/50 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FiZap className="text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm">{item.title || item.platform}</span>
            <span className="text-sm text-muted-foreground">
              {item.saves ? `${item.saves} saves` : `${item.posts} posts`} • {item.avgEngagement || item.engagement}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
