'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';
import {
  FiUser,
  FiMail,
  FiCreditCard,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiLoader,
  FiX,
} from 'react-icons/fi';

interface SubscriptionInfo {
  status: string;
  plan: string;
  current_period_end: string;
  stripe_customer_id: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const supabaseUser = useAuthStore((state) => state.supabaseUser);
  const [activeTab, setActiveTab] = useState<'account' | 'subscription' | 'security'>('account');
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    // Check if returned from portal
    if (searchParams.get('portal') === 'success') {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 5000);
      // Clean URL
      router.replace('/dashboard/settings');
    }

    // Fetch subscription info
    fetchSubscriptionInfo();
  }, [searchParams]);

  const fetchSubscriptionInfo = async () => {
    if (!user?.id) return;

    try {
      // Fetch subscription status from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, current_period_end')
        .eq('id', user.id)
        .single();

      // Fetch stripe_customer_id from users (needed for customer portal)
      const { data: profileData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!userError && userData) {
        setSubscriptionInfo({
          status: userData.subscription_status || 'inactive',
          plan: userData.subscription_plan || 'none',
          current_period_end: userData.current_period_end || '',
          stripe_customer_id: (profileData as any)?.stripe_customer_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to open billing portal');
        setIsLoadingPortal(false);
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal');
      setIsLoadingPortal(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanDisplayName = (plan: string) => {
    const planMap: Record<string, string> = {
      starter: 'Starter Plan',
      growth: 'Growth Plan',
      unlimited: 'Unlimited Plan',
    };
    return planMap[plan] || 'No Plan';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'text-green-400',
      trialing: 'text-blue-400',
      past_due: 'text-yellow-400',
      canceled: 'text-red-400',
      inactive: 'text-gray-400',
    };
    return statusColors[status] || 'text-gray-400';
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: FiUser },
    { id: 'subscription' as const, label: 'Subscription', icon: FiCreditCard },
    { id: 'security' as const, label: 'Security', icon: FiShield },
  ];

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="glass-card p-4 border-2 border-green-500/30 bg-green-500/10 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-white font-semibold">Changes Saved</h3>
                <p className="text-sm text-gray-400">Your subscription has been updated successfully.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account, subscription, and security settings.</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
            <div className="glass-card p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400" />
                <span className="text-white">{user?.name || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <div className="glass-card p-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <FiMail className="text-gray-400" />
                <span className="text-white">{user?.email || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">User ID</label>
            <div className="glass-card p-4 border border-gray-700">
              <code className="text-sm text-gray-300">{user?.id || 'N/A'}</code>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Plan</h2>

            {isLoadingSubscription ? (
              <div className="flex items-center justify-center py-8">
                <FiLoader className="w-6 h-6 text-primary-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {subscriptionInfo ? getPlanDisplayName(subscriptionInfo.plan) : 'No Active Plan'}
                      </h3>
                      {subscriptionInfo && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            subscriptionInfo.status
                          )} bg-dark-500`}
                        >
                          {subscriptionInfo.status.charAt(0).toUpperCase() + subscriptionInfo.status.slice(1)}
                        </span>
                      )}
                    </div>
                    {subscriptionInfo?.current_period_end && (
                      <p className="text-gray-400 text-sm">
                        Renews on {formatDate(subscriptionInfo.current_period_end)}
                      </p>
                    )}
                  </div>

                  {subscriptionInfo?.stripe_customer_id && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={isLoadingPortal}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isLoadingPortal ? (
                        <>
                          <FiLoader className="w-5 h-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Manage Subscription
                          <FiExternalLink className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {!subscriptionInfo?.stripe_customer_id && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">No Active Subscription</h4>
                      <p className="text-sm text-gray-400 mb-3">
                        Subscribe to a plan to unlock all features and start creating amazing content.
                      </p>
                      <button
                        onClick={() => router.push('/pricing')}
                        className="btn-primary text-sm"
                      >
                        View Plans
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing Portal Info */}
          {subscriptionInfo?.stripe_customer_id && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Billing Portal</h3>
              <p className="text-gray-400 mb-4">
                Use the Stripe Customer Portal to manage your subscription, update payment methods, view invoices, and more.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" />
                  <span>Update or change payment method</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" />
                  <span>View and download invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" />
                  <span>Update billing information</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" />
                  <span>Cancel or change subscription</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
          </div>

          {/* Password */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Password</h3>
            <p className="text-gray-400 text-sm mb-4">
              Change your password to keep your account secure.
            </p>
            <button
              onClick={async () => {
                const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) {
                  alert('Failed to send reset email');
                } else {
                  alert('Password reset email sent! Check your inbox.');
                }
              }}
              className="btn-secondary"
            >
              Send Password Reset Email
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Sign Out</h3>
            <p className="text-gray-400 text-sm mb-4">
              Sign out of your account on this device.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="btn-secondary text-red-400 border-red-400 hover:bg-red-500/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
