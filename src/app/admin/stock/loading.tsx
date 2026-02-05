import { Card } from "@/components/ui/card";

export default function StockLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>

      {/* Value Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}
