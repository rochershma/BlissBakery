export default function MenuLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-muted/50" />
      <div className="border-b border-border/50 px-4 py-2">
        <div className="max-w-[1300px] mx-auto h-4 bg-muted rounded w-48" />
      </div>
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-4">
        {/* Category pills skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-xl flex-shrink-0" />
          ))}
        </div>
        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
              <div className="aspect-[4/5] bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-5 bg-muted rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
