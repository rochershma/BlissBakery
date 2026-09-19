export default function CheckoutLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-muted/50" />
      <div className="border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto h-8 bg-muted rounded" />
      </div>
      <div className="max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Order summary skeleton */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="h-5 bg-muted rounded w-32" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        </div>
        {/* Order type skeleton */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 bg-muted rounded-xl" />
            <div className="h-12 flex-1 bg-muted rounded-xl" />
          </div>
        </div>
        {/* Date skeleton */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[72px] h-[70px] bg-muted rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
