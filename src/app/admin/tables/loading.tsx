import { Card } from "@/components/ui/card";

export default function TablesLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2">
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-16 bg-muted animate-pulse rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-9 flex-1 bg-muted animate-pulse rounded" />
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
