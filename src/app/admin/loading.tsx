export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-muted rounded-full" />
        <div className="h-6 bg-muted rounded w-48" />
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="h-5 bg-muted rounded w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="h-5 bg-muted rounded w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
      <div className="h-12 bg-muted rounded-xl" />
    </div>
  );
}
