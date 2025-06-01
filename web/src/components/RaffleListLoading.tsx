export function RaffleListLoading() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Raffles</h2>
      <div className="grid gap-4">
        {/* Show 3 skeleton cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 border border-zinc-800 rounded-lg animate-pulse"
          >
            {/* Header skeleton */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="h-6 bg-zinc-800 rounded w-24"></div>
                <div className="h-3 bg-zinc-800 rounded w-20"></div>
              </div>
              <div className="h-10 bg-zinc-800 rounded-lg w-28"></div>
            </div>
            
            {/* Main content - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Token section skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-20"></div>
                <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-700 rounded w-32"></div>
                    <div className="h-3 bg-zinc-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
              
              {/* Owner section skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-20"></div>
                <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-700 rounded w-28"></div>
                    <div className="h-3 bg-zinc-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
              
              {/* Winner section skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-16"></div>
                <div className="bg-zinc-800/50 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-700 rounded w-32"></div>
                    <div className="h-3 bg-zinc-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}