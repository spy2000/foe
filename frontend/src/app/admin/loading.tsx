export default function AdminLoading() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 w-full">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 border-b pb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
