"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ChefHat, AlertTriangle, TrendingUp, ArrowRight, FileText } from "lucide-react";
import type { StockItem, Ingredient } from "@/types";

interface StockAnalytics {
  stockItems: {
    total: number;
    lowStock: number;
    items: StockItem[];
    totalValue: number;
  };
  ingredients: {
    total: number;
    lowStock: number;
    items: Ingredient[];
    totalValue: number;
  };
  totalValue: number;
}

interface StockDashboardProps {
  analytics: StockAnalytics;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " F";
}

function getUnitLabel(unit: string) {
  const labels: Record<string, string> = {
    unit: "unite(s)",
    kg: "kg",
    g: "g",
    l: "L",
    ml: "ml",
    piece: "piece(s)",
  };
  return labels[unit] || unit;
}

export function StockDashboard({ analytics }: StockDashboardProps) {
  const totalLowStock = analytics.stockItems.lowStock + analytics.ingredients.lowStock;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Stocks</h1>
          <p className="text-muted-foreground">
            Gerez vos boissons, desserts et ingredients
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.stockItems.total}</div>
            <p className="text-xs text-muted-foreground">
              Boissons et desserts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.ingredients.total}</div>
            <p className="text-xs text-muted-foreground">
              Ingredients cuisine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalLowStock}</div>
            <p className="text-xs text-muted-foreground">
              Seuil minimum atteint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Stock valorise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/stock/items">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Boissons & Desserts
              </CardTitle>
              <CardDescription>
                Gerer le stock des articles comptables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Voir les articles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/stock/ingredients">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Ingredients
              </CardTitle>
              <CardDescription>
                Gerer les ingredients de cuisine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Voir les ingredients
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/stock/recipes">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recettes
              </CardTitle>
              <CardDescription>
                Lier ingredients aux plats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Gerer les recettes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/stock/requests">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Demandes
              </CardTitle>
              <CardDescription>
                Demandes d'ingredients du chef
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Voir les demandes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Low Stock Alerts */}
      {totalLowStock > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertes Stock Bas
            </CardTitle>
            <CardDescription>
              Ces articles ont atteint le seuil minimum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Low Stock Items */}
              {analytics.stockItems.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Boissons & Desserts</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {analytics.stockItems.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Seuil: {item.min_threshold} {getUnitLabel(item.unit)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {item.current_quantity} {getUnitLabel(item.unit)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Ingredients */}
              {analytics.ingredients.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Ingredients</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {analytics.ingredients.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Seuil: {item.min_threshold} {getUnitLabel(item.unit)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {item.current_quantity} {getUnitLabel(item.unit)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Value Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valeur Stock Articles</CardTitle>
            <CardDescription>Boissons et desserts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(analytics.stockItems.totalValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.stockItems.total} articles en stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valeur Stock Ingredients</CardTitle>
            <CardDescription>Ingredients cuisine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(analytics.ingredients.totalValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {analytics.ingredients.total} ingredients en stock
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
