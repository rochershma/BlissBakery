export default function CartLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-muted/50" />
      <div className="max-w-4xl mx-auto w-full px-4 py-4">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-5 bg-muted rounded w-12" />
          </div>
        ))}
        <div className="mt-4 p-4 space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-6 bg-muted rounded w-1/2 mt-3" />
        </div>
      </div>
    </div>
  );
}
