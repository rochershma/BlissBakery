export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 h-[56px] md:h-[64px] bg-white/80 border-b border-border/30" />

      {/* Banner skeleton */}
      <div className="max-w-[1300px] mx-auto px-4 md:px-5 w-full pt-6 md:pt-8">
        <div className="w-full aspect-[2/1] rounded-[22px] bg-muted" />
      </div>

      {/* Categories skeleton */}
      <div className="max-w-[1300px] mx-auto px-4 md:px-5 w-full mt-8">
        <div className="h-5 w-32 bg-muted rounded mb-2" />
        <div className="h-8 w-64 bg-muted rounded mb-5" />
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[200px] h-[240px] rounded-[18px] bg-muted flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Occasions skeleton */}
      <div className="max-w-[1300px] mx-auto px-4 md:px-5 w-full mt-10">
        <div className="h-5 w-40 bg-muted rounded mb-2" />
        <div className="h-8 w-56 bg-muted rounded mb-5" />
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[200px] h-[240px] rounded-[18px] bg-muted flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Bestsellers skeleton */}
      <div className="max-w-[1300px] mx-auto px-4 md:px-5 w-full mt-16">
        <div className="h-5 w-28 bg-muted rounded mb-2" />
        <div className="h-8 w-48 bg-muted rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[22px] bg-white border border-border/50 overflow-hidden">
              <div className="h-[200px] bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-full bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
