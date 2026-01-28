"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Zap,
  DollarSign,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const stats = [
    {
      title: "Pricing Plans",
      description: "Manage subscription plans and rate limits",
      icon: DollarSign,
      href: "/admin/pricing",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "System Templates",
      description: "Create and edit system-wide carousel templates",
      icon: Zap,
      href: "/admin/templates",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Testimonials",
      description: "Manage customer testimonials and reviews",
      icon: Users,
      href: "/admin/testimonials",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-foreground/60">
          Manage platform settings, plans, and content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.href}
              className="glass-card hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(stat.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-lg">{stat.title}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/pricing")}
              className="h-12"
            >
              View Plans
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/templates")}
              className="h-12"
            >
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/testimonials")}
              className="h-12"
            >
              Testimonials
            </Button>
            <Button
              variant="outline"
              disabled
              className="h-12"
            >
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
