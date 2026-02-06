"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatXOF } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  Percent,
  Clock,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type {
  DailyProfitData,
  ProfitSummary,
  ItemProfitData,
  PeakHourData,
} from "@/actions/reports.actions";

interface ProfitDashboardProps {
  summary: ProfitSummary;
  dailyProfit: DailyProfitData[];
  itemMargins: ItemProfitData[];
  peakHours: PeakHourData[];
  trends: Array<{
    week: number;
    startDate: string;
    endDate: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
    avgOrderValue: number;
  }>;
  onExport?: (format: "pdf" | "excel") => void;
}

const COLORS = {
  revenue: "#0077B6",
  cost: "#EF4444",
  profit: "#10B981",
  neutral: "#6B7280",
};

const HOUR_LABELS: Record<number, string> = {
  0: "00h", 1: "01h", 2: "02h", 3: "03h", 4: "04h", 5: "05h",
  6: "06h", 7: "07h", 8: "08h", 9: "09h", 10: "10h", 11: "11h",
  12: "12h", 13: "13h", 14: "14h", 15: "15h", 16: "16h", 17: "17h",
  18: "18h", 19: "19h", 20: "20h", 21: "21h", 22: "22h", 23: "23h",
};

export function ProfitDashboard({
  summary,
  dailyProfit,
  itemMargins,
  peakHours,
  trends,
  onExport,
}: ProfitDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Calculate trend comparison
  const currentWeek = trends[trends.length - 1];
  const previousWeek = trends[trends.length - 2];
  const profitChange = currentWeek && previousWeek
    ? ((currentWeek.profit - previousWeek.profit) / Math.max(previousWeek.profit, 1)) * 100
    : 0;
  const revenueChange = currentWeek && previousWeek
    ? ((currentWeek.revenue - previousWeek.revenue) / Math.max(previousWeek.revenue, 1)) * 100
    : 0;

  // Filter peak hours to only show business hours
  const businessHours = peakHours.filter(h => h.hour >= 10 && h.hour <= 22);
  const maxOrders = Math.max(...businessHours.map(h => h.totalOrders), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Analyse des Benefices</h1>
          <p className="text-muted-foreground">
            Suivi des revenus, couts et marges beneficiaires
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          {onExport && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatXOF(summary.totalRevenue)}</div>
            <div className="flex items-center text-xs mt-1">
              {revenueChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={revenueChange >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs semaine precedente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Couts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatXOF(summary.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              Stock et ingredients utilises
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benefice net</CardTitle>
            <PiggyBank className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatXOF(summary.totalProfit)}</div>
            <div className="flex items-center text-xs mt-1">
              {profitChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={profitChange >= 0 ? "text-green-600" : "text-red-500"}>
                {Math.abs(profitChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs semaine precedente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge beneficiaire</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Benefice moyen: {formatXOF(summary.averageProfit)}/commande
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Cost vs Profit Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolution Revenus / Couts / Benefices</CardTitle>
          <CardDescription>Tendance sur les {selectedPeriod} derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyProfit}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.revenue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                  className="text-xs"
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatXOF(Number(value) || 0),
                    name === "revenue" ? "Revenu" : name === "cost" ? "Cout" : "Benefice",
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "revenue" ? "Revenu" : value === "cost" ? "Cout" : "Benefice"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.revenue}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke={COLORS.cost}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={COLORS.profit}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Heures de pointe
            </CardTitle>
            <CardDescription>Nombre de commandes par heure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={businessHours}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(h) => HOUR_LABELS[h] || `${h}h`}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={(value) => [`${value} commandes`, "Total"]}
                    labelFormatter={(h) => `${HOUR_LABELS[h] || h + "h"}`}
                  />
                  <Bar dataKey="totalOrders" radius={[4, 4, 0, 0]}>
                    {businessHours.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.totalOrders >= maxOrders * 0.8
                            ? COLORS.profit
                            : entry.totalOrders >= maxOrders * 0.5
                            ? COLORS.revenue
                            : COLORS.neutral
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendances hebdomadaires
            </CardTitle>
            <CardDescription>Comparaison semaine par semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.map((week, index) => {
                const prevWeek = trends[index - 1];
                const change = prevWeek
                  ? ((week.profit - prevWeek.profit) / Math.max(prevWeek.profit, 1)) * 100
                  : 0;

                return (
                  <div key={week.week} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Semaine {week.week}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(week.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        {" - "}
                        {new Date(week.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatXOF(week.profit)}</p>
                      <div className="flex items-center justify-end text-xs">
                        {index > 0 && (
                          <>
                            {change >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                            )}
                            <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
                              {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Profit Margins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marges par article</CardTitle>
          <CardDescription>Rentabilite de chaque produit vendu</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Cout</TableHead>
                <TableHead className="text-right">Benefice/u</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead className="text-right">Vendus</TableHead>
                <TableHead className="text-right">Benefice total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemMargins.slice(0, 15).map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatXOF(item.salePrice)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatXOF(item.costPrice)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatXOF(item.profit)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={item.profitMargin >= 50 ? "default" : item.profitMargin >= 30 ? "secondary" : "outline"}
                    >
                      {item.profitMargin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.totalSold}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatXOF(item.totalProfit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
