export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-bg pl-60">
      <div className="p-8 space-y-6 animate-pulse max-w-[800px]">
        <div className="space-y-3">
          <div className="h-9 w-40 bg-white/5 rounded-lg" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>

        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4 p-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="h-10 w-full bg-white/5 rounded-xl" />
            <div className="h-10 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
