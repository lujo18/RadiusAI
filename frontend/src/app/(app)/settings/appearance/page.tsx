"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AppearancePage() {
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");

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
              <label className="flex items-center space-x-3 cursor-pointer" onClick={() => setTheme('system')}>
                <input name="theme" type="radio" checked={theme === 'system'} readOnly />
                <Label className="font-medium">System</Label>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 cursor-pointer" onClick={() => setTheme('dark')}>
                <input name="theme" type="radio" checked={theme === 'dark'} readOnly />
                <Label className="font-medium">Dark</Label>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-3 cursor-pointer" onClick={() => setTheme('light')}>
                <input name="theme" type="radio" checked={theme === 'light'} readOnly />
                <Label className="font-medium">Light</Label>
              </label>
            </div>

            <div>
              <Button onClick={() => console.log('apply theme', theme)}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
