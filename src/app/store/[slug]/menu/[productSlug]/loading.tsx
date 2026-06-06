export default function ProductLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-muted/50" />
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-4">
        <div className="h-3 bg-muted rounded w-48 mb-4" />
        <div className="md:flex md:gap-10">
          {/* Image skeleton */}
          <div className="md:w-1/2 mb-5 md:mb-0">
            <div className="aspect-square rounded-2xl bg-muted" />
          </div>
          {/* Info skeleton */}
          <div className="md:w-1/2 space-y-4">
            <div className="h-3 bg-muted rounded w-20" />
            <div className="h-7 bg-muted rounded w-3/4" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded-full w-24" />
              <div className="h-6 bg-muted rounded-full w-20" />
            </div>
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-8 bg-muted rounded w-20 mt-4" />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-20 bg-muted rounded-xl" />
              ))}
            </div>
            <div className="h-12 bg-muted rounded-2xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
