"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function SecurityPage() {
  const [twofa, setTwofa] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="text-foreground/60">Password, two-factor authentication, and sessions</p>
      </div>
      
      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Protect your account with an additional verification step</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Checkbox id="2fa" checked={twofa} onCheckedChange={(c) => setTwofa(Boolean(c))} />
            <div>
              <div className="font-medium">Enable 2FA</div>
              <div className="text-sm text-foreground/70">Use an authenticator app or SMS for verification</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
