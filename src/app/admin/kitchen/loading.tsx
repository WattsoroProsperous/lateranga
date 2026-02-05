import { Card } from "@/components/ui/card";

export default function KitchenLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 min-w-max h-full">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-80 flex flex-col bg-muted/30 rounded-xl"
            >
              <div className="p-4 border-b">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex-1 p-2 space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Card key={j} className="p-3">
                    <div className="space-y-2">
                      <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-12 bg-muted animate-pulse rounded" />
                      <div className="h-8 bg-muted animate-pulse rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
