"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AccountSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = () => {
    // Placeholder: integrate API save
    console.log("Save account", { name, email });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-foreground/60">Personal details and account information</p>
      </div>

      <Card className="glass-card max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name and contact email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave}>Save changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
