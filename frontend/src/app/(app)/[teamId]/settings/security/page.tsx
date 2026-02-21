"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function SecurityPage() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [twofa, setTwofa] = useState(false);

  const handleChangePassword = () => {
    console.log("change password", { current, password });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Security</h1>
        <p className="text-foreground/60">Password, two-factor authentication, and sessions</p>
      </div>

      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="pt-2">
              <Button onClick={handleChangePassword}>Change password</Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
