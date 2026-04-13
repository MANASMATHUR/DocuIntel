export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg pl-60">
      <div className="p-8 space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-3 w-32 bg-white/5 rounded" />
          <div className="h-10 w-80 bg-white/5 rounded-lg" />
          <div className="h-4 w-96 bg-white/5 rounded" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1 h-96 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
          <div className="lg:col-span-2 h-96 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
