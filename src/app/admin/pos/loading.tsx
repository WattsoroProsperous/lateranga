export default function POSLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex gap-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-80 bg-card border border-border rounded-xl p-4">
        <div className="h-6 w-20 bg-muted animate-pulse rounded mb-4" />
        <div className="flex-1 py-8">
          <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
