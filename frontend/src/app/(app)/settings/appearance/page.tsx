"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

export default function AppearancePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  // Keep a local value for controlled inputs until apply
  const [local, setLocal] = useState<string>(theme || "system");

  useEffect(() => {
    // Sync when theme changes elsewhere
    setLocal(theme || "system");
  }, [theme]);

  const apply = async (value: string) => {
    setSaving(true);
    try {
      await setTheme(value as 'light' | 'dark' | 'system');
      // small UX delay for feedback
      setTimeout(() => setSaving(false), 600);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appearance</h1>
        <p className="text-foreground/60">Theme and display preferences</p>
      </div>

      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose light, dark, or follow system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="theme"
                  type="radio"
                  checked={local === 'system'}
                  onChange={() => setLocal('system')}
                />
                <Label className="font-medium">System</Label>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="theme"
                  type="radio"
                  checked={local === 'dark'}
                  onChange={() => setLocal('dark')}
                />
                <Label className="font-medium">Dark</Label>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="theme"
                  type="radio"
                  checked={local === 'light'}
                  onChange={() => setLocal('light')}
                />
                <Label className="font-medium">Light</Label>
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Button onClick={() => apply(local)} disabled={saving}>
                  {saving ? 'Applying...' : 'Apply'}
                </Button>
                <div className="text-sm text-foreground/60">
                  Current: {resolvedTheme || theme}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
