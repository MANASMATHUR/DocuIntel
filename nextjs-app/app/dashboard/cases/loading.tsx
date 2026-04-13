export default function CasesLoading() {
  return (
    <div className="min-h-screen bg-bg pl-60">
      <div className="p-8 space-y-6 animate-pulse max-w-[1200px]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-9 w-56 bg-white/5 rounded-lg" />
            <div className="h-4 w-80 bg-white/5 rounded" />
          </div>
          <div className="h-12 w-32 bg-white/5 rounded-full" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
          ))}
        </div>

        {/* Search bar */}
        <div className="h-12 bg-white/[0.02] border border-white/[0.05] rounded-xl" />

        {/* Case list */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-white/[0.02] border border-white/[0.05] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
