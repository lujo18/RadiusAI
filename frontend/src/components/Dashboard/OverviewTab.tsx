import React from "react";
import { FiZap, FiRefreshCw, FiCalendar, FiHeart, FiTrendingUp, FiCheckCircle, FiInstagram, FiPlay, FiSettings } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          <p className="text-muted-foreground">Manage your automated content pipeline</p>
        </div>
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary/80 text-primary-foreground disabled:bg-muted px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
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
        </Button>
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Weekly Performance</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingPosts.map((post: any) => (
            <div key={post.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${post.platform === 'Instagram' ? 'bg-chart-5/20' : 'bg-chart-2/20'}`}>
                  {post.platform === 'Instagram' ? (
                    <FiInstagram className="text-chart-5" />
                  ) : (
                    <FiPlay className="text-chart-2" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.platform} • {post.date} at {post.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-chart-4/20 text-chart-4 hover:bg-chart-4/30">
                  {post.status}
                </Badge>
                <Button variant="ghost" size="icon">
                  <FiSettings />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
