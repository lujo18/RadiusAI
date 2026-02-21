"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsIndexPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Settings</h1>
          <p className="text-foreground/60">Manage account, billing, security and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/settings/account">Open Account</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Profile & Account</CardTitle>
            <CardDescription>Manage your profile information and account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/settings/account" className="text-primary hover:underline">Account</Link>
              <Link href="/settings/billing" className="text-primary hover:underline">Billing</Link>
              <Link href="/settings/security" className="text-primary hover:underline">Security</Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize notifications and appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/settings/notifications" className="text-primary hover:underline">Notifications</Link>
              <Link href="/settings/appearance" className="text-primary hover:underline">Appearance</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
