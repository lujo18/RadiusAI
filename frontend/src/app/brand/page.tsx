"use client";

import React from "react";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardStore, useAuthStore } from '@/store';
import { useBrandFilter } from '@/hooks/useProfileFilter';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiActivity, FiArrowRight, FiPlus, FiCheckCircle, FiX } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingModal from '@/components/OnboardingModal';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGenerating = useDashboardStore((state) => state.isGenerating);
  const stats = useDashboardStore((state) => state.stats);
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const { activeBrandId, isAllBrands } = useBrandFilter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    // Restore session after Stripe redirect if needed
    const restoreSession = async () => {
      const sessionId = searchParams.get('session_id');
      
      // If coming from Stripe, ensure session is restored
      if (sessionId && !user) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          const restoredUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            plan: 'growth' as const,
          };
          login(restoredUser, session.user, session);
        } else if (error || !session) {
          // Session invalid, redirect to login
          router.push('/login?error=session_expired');
          return;
        }
      }
    };
    
    restoreSession();
    
    // Check if user just completed payment
    const sessionId = searchParams.get('session_id');
    const onboarding = searchParams.get('onboarding');
    
    if (sessionId) {
      // Show success banner
      setShowSuccessBanner(true);
      
      // Auto-hide banner after 5 seconds
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
    
    if (onboarding === 'true') {
      // Show onboarding modal
      setShowOnboarding(true);
    }
  }, [searchParams]);

  // Mock data - replace with actual API calls
  const mockStats = {
    totalBalance: 23094.57,
    balanceChange: 12.83,
    monthlyRevenue: 34502.19,
    postsScheduled: 98,

    totalEngagement: 34567,
    avgEngagementRate: 8.4,
  };

  const campaigns = [
    { 
      id: 1, 
      name: 'IBO Advertising', 
      admin: 'Samuel', 
      date: '02/14/2019', 
      category: 'Advertising',
      followers: 60,
      status: 'Public',
      action: 'Join'
    },
    { 
      id: 2, 
      name: 'Pela Design Studio', 
      admin: 'Hossein', 
      date: '09/23/2017', 
      category: 'Design Agency',
      followers: 60,
      status: 'Public',
      action: 'Join'
    },
    { 
      id: 3, 
      name: 'Emma Fashion Brand', 
      admin: 'Maria', 
      date: '04/05/2023', 
      category: 'Social Fandom',
      followers: 80,
      status: 'Private',
      action: 'Request'
    },
    { 
      id: 4, 
      name: 'Atasco Programming', 
      admin: 'Stephanie', 
      date: '11/18/2021', 
      category: 'Programming',
      followers: 90,
      status: 'Public',
      action: 'Join'
    },
  ];

  const performanceData = [
    { label: 'Mar 8', value: 5200 },
    { label: 'Mar 18', value: 5400 },
    { label: 'Mar 28', value: 5638 },
    { label: 'Apr 8', value: 5850 },
  ];

  const maxValue = Math.max(...performanceData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Payment Success Banner */}
      {showSuccessBanner && (
        <div className="glass-card p-4 border-2 border-green-500/30 bg-green-500/10 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-foreground font-semibold">Payment Successful! 🎉</h3>
                <p className="text-sm text-muted">Your subscription is now active. Welcome to ViralStack!</p>
              </div>
            </div>
            <Button
              onClick={() => setShowSuccessBanner(false)}
              className="text-muted hover:text-foreground transition-colors"
            >
              <FiX className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-main text-foreground mb-2">Dashboard</h1>
          <p className="text-muted">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field">
            <option>Finance</option>
            <option>Marketing</option>
            <option>Sales</option>
          </select>
          <Button className="btn-primary" onClick={() => router.push('/brand/generate')}>
            <FiPlus className="inline mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Overview Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Overview</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">Max records</span>
                <span className="text-lg text-muted">
                  2 times increase <FiTrendingUp className="text-xs" />
                </span>
              </div>
            </div>

            {/* Time Period Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-button">
              <Button className="flex-1 py-2 text-sm text-muted hover:text-foreground transition">24h</Button>
              <Button className="flex-1 py-2 text-sm text-muted hover:text-foreground transition">Week</Button>
              <Button className="flex-1 py-2 text-sm bg-accent text-foreground rounded-button">Month</Button>
            </div>

            {/* Chart */}
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 300 150">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area under line */}
                <path
                  d={`M 0,${150 - (performanceData[0].value / maxValue) * 120} 
                      L 100,${150 - (performanceData[1].value / maxValue) * 120}
                      L 200,${150 - (performanceData[2].value / maxValue) * 120}
                      L 300,${150 - (performanceData[3].value / maxValue) * 120}
                      L 300,150 L 0,150 Z`}
                  fill="url(#chartGradient)"
                />
                
                {/* Line */}
                <path
                  d={`M 0,${150 - (performanceData[0].value / maxValue) * 120} 
                      L 100,${150 - (performanceData[1].value / maxValue) * 120}
                      L 200,${150 - (performanceData[2].value / maxValue) * 120}
                      L 300,${150 - (performanceData[3].value / maxValue) * 120}`}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  className="chart-line"
                />
                
                {/* Data points */}
                {performanceData.map((point, idx) => (
                  <circle
                    key={idx}
                    cx={idx * 100}
                    cy={150 - (point.value / maxValue) * 120}
                    r="4"
                    fill="#3b82f6"
                    className="hover-glow"
                  />
                ))}
              </svg>
              
              {/* Current value indicator */}
              <div className="absolute top-4 right-4 text-right">
                <div className="text-xs text-muted mb-1">Mar 29</div>
                <div className="text-xl font-bold text-foreground">$ 5,638.65</div>
                <div className="text-xs metric-positive">↑ 9.41 %</div>
              </div>
            </div>

            {/* Bottom stats */}
            <div className="pt-4 border-t border-muted/20">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gradient-blue">+19.23</span>
                <span className="text-lg text-muted">%</span>
              </div>
              <div className="text-xs text-muted/70 mt-1">Last updated: Today, 06:49 AM</div>
            </div>
          </div>
        </div>

        {/* Middle Column - Balance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm text-muted mb-1">Total Balance</h3>
                <p className="text-xs text-muted/70">The sum of all amounts on my wallet</p>
              </div>
              <select className="input-field text-sm py-1.5 px-3">
                <option>US Dollar</option>
                <option>Euro</option>
                <option>GBP</option>
              </select>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-gradient-blue mb-2">$ {mockStats.totalBalance.toLocaleString()}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted/70">Yearly avg: $ {mockStats.monthlyRevenue.toLocaleString()}</span>
                <span className="metric-positive">
                  <FiTrendingUp className="text-sm" /> {mockStats.balanceChange}%
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-muted text-xs">Compared to last month</span>
                <span className="text-primary-400 text-xs font-medium">$716 ↑</span>
              </div>
            </div>

            {/* AI Assistant Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/20">
              <div className="relative z-10">
                <div className="text-sm text-gray-300 mb-2">AI Assistant</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  is updating the balance amount now...
                </div>
              </div>
              {/* Abstract 3D shape placeholder */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-secondary text-sm py-3">
                <FiActivity className="inline mr-2" />
                Analytics
              </button>
              <button className="btn-secondary text-sm py-3">
                <FiUsers className="inline mr-2" />
                Team
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Premium Banner */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-gray-400">Ads</h3>
              <button className="btn-ghost text-xs py-1 px-3">
                Next <FiArrowRight className="inline ml-1" />
              </button>
            </div>
            
            <div className="text-xs text-gray-500 mb-6">Powered by Carbon</div>
            
            <button className="w-full py-3 bg-dark-200 hover:bg-dark-100 rounded-button text-sm font-medium transition-colors mb-6">
              Just for today!
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <FiTrendingUp className="text-yellow-400 text-2xl" />
                </div>
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    Let's Go Premium with 
                    <span className="premium-badge">40%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">This is your amazing chance!</div>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Our premium subscription elevate your experience and unlock a range of benefits tailored to your preferences.
              </p>
              
              <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                Learn more <FiArrowRight className="text-xs" />
              </button>
              
              <div className="flex items-center gap-3 pt-4 border-t">
                <button className="text-xs text-gray-400 hover:text-white transition-colors">
                  Don't show again
                </button>
                <button className="ml-auto btn-primary text-sm py-2 px-6">
                  Get started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Campaigns Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-main text-white">Popular Campaigns</h2>
          <div className="flex items-center gap-3">
            <div className="badge-blue">as List</div>
            <button className="btn-ghost text-sm">
              View All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Admin</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Date Added</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Business</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Followers</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Operation</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="table-row">
                  <td className="py-4 px-4 text-sm text-gray-400">#{campaign.id}</td>
                  <td className="py-4 px-4 text-sm font-medium text-white">{campaign.name}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                        {campaign.admin[0]}
                      </div>
                      <span className="text-sm text-gray-300">{campaign.admin}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-400">{campaign.date}</td>
                  <td className="py-4 px-4 text-sm text-gray-300">{campaign.category}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-dark-200"></div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">{campaign.followers}+</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={campaign.status === 'Public' ? 'badge-blue' : 'badge-purple'}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className={campaign.action === 'Join' ? 'btn-primary text-sm py-1.5 px-4' : 'btn-secondary text-sm py-1.5 px-4'}>
                      {campaign.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

