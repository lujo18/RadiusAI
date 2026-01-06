"use client";

import React from "react";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { ModeToggle } from "@/components/ModeToggle";

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
      router.replace('/brand/settings');
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
      pro: 'Pro (Radius)',
      agency: 'Agency (Radius)',
    };
    return planMap[plan] || 'No Plan';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'text-chart-4',
      trialing: 'text-chart-2',
      past_due: 'text-chart-1',
      canceled: 'text-destructive',
      inactive: 'text-muted-foreground',
    };
    return statusColors[status] || 'text-muted-foreground';
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
        <Card className="border-2 border-chart-4/30 bg-chart-4/10 animate-slide-down">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="w-6 h-6 text-chart-4" />
                <div>
                  <h3 className="font-semibold">Changes Saved</h3>
                  <p className="text-sm text-muted-foreground">Your subscription has been updated successfully.</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessBanner(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, subscription, and security settings.</p>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`flex items-center gap-2 ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div>
              <Label className="mb-2">Name</Label>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-muted-foreground" />
                    <span>{user?.name || 'Not set'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email */}
            <div>
              <Label className="mb-2">Email</Label>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FiMail className="text-muted-foreground" />
                    <span>{user?.email || 'Not set'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User ID */}
            <div>
              <Label className="mb-2">User ID</Label>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <code className="text-sm text-muted-foreground">{user?.id || 'N/A'}</code>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">
                          {subscriptionInfo ? getPlanDisplayName(subscriptionInfo.plan) : 'No Active Plan'}
                        </h3>
                        {subscriptionInfo && (
                          <Badge variant={subscriptionInfo.status === 'active' ? 'default' : 'secondary'}>
                            {subscriptionInfo.status.charAt(0).toUpperCase() + subscriptionInfo.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                      {subscriptionInfo?.current_period_end && (
                        <p className="text-muted-foreground text-sm">
                          Renews on {formatDate(subscriptionInfo.current_period_end)}
                        </p>
                      )}
                    </div>

                    {subscriptionInfo?.stripe_customer_id && (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={isLoadingPortal}
                      >
                        {isLoadingPortal ? (
                          <>
                            <FiLoader className="w-5 h-5 animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Manage Subscription
                            <FiExternalLink className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {!subscriptionInfo?.stripe_customer_id && (
                    <Card className="bg-chart-1/10 border-chart-1/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FiAlertCircle className="w-5 h-5 text-chart-1 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1">No Active Subscription</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Subscribe to a plan to unlock all features and start creating amazing content.
                            </p>
                            <Button
                              onClick={() => router.push('/pricing')}
                              size="sm"

                            >
                              View Plans
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Portal Info */}
          {subscriptionInfo?.stripe_customer_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Portal</CardTitle>
                <CardDescription>
                  Use the Stripe Customer Portal to manage your subscription, update payment methods, view invoices, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-chart-4" />
                    <span>Update or change payment method</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-chart-4" />
                    <span>View and download invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-chart-4" />
                    <span>Update billing information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-chart-4" />
                    <span>Cancel or change subscription</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Password</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Change your password to keep your account secure.
              </p>
              <Button
                variant="secondary"
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
              >
                Send Password Reset Email
              </Button>
            </div>

            {/* Sign Out */}
            <div className="border-t border pt-6">
              <h3 className="text-lg font-semibold mb-2">Sign Out</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Sign out of your account on this device.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/');
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode Toggle */}
      <div className="mt-6">
        <ModeToggle />
      </div>
    </div>
  );
}
