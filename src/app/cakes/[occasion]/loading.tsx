export default function OccasionLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-muted/50" />
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-3">
        <div className="h-3 bg-muted rounded w-40 mb-4" />
        {/* Sub-tag circles */}
        <div className="flex gap-5 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted" />
              <div className="h-3 bg-muted rounded w-10" />
            </div>
          ))}
        </div>
        {/* Title */}
        <div className="h-7 bg-muted rounded w-48 mt-4" />
        <div className="h-3 bg-muted rounded w-32 mt-2" />
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px] mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
              <div className="aspect-square bg-muted" />
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
