"use client";

import { Card } from "@/components/ui/card";
import { formatXOF } from "@/lib/utils";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: string;
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-display text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{description}</span>
        {trend && (
          <span className="font-medium text-green-600 dark:text-green-400">
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
    todayOrders: number;
    todayRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Commandes aujourd'hui"
        value={String(stats.todayOrders)}
        description="Commandes reçues"
        icon={ShoppingBag}
      />
      <StatCard
        title="Revenu du jour"
        value={formatXOF(stats.todayRevenue)}
        description="Chiffre d'affaires"
        icon={TrendingUp}
      />
      <StatCard
        title="En attente"
        value={String(stats.pendingOrders)}
        description="À traiter"
        icon={Clock}
      />
      <StatCard
        title="Complétées"
        value={String(stats.completedOrders)}
        description="Commandes livrées"
        icon={CheckCircle2}
      />
    </div>
  );
}
