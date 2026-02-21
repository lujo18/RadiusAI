"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inApp, setInApp] = useState(true);

  const handleSave = () => {
    console.log("save notifications", { emailNotifications, inApp });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-foreground/60">Control how you receive notifications</p>
      </div>

      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox id="email" checked={emailNotifications} onCheckedChange={(c) => setEmailNotifications(Boolean(c))} />
              <div>
                <div className="font-medium">Email notifications</div>
                <div className="text-sm text-foreground/70">Receive important account emails</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="inapp" checked={inApp} onCheckedChange={(c) => setInApp(Boolean(c))} />
              <div>
                <div className="font-medium">In-app notifications</div>
                <div className="text-sm text-foreground/70">Show notifications inside the app</div>
              </div>
            </div>

            <div>
              <Button onClick={handleSave}>Save preferences</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
