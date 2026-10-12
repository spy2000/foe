import SkeletonTable from "@/components/skeletons/SkeletonTable";

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Main Container Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
        {/* Toolbar Skeleton */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/40">
          <div className="h-9 w-44 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-9 w-72 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Table Body Skeleton */}
        <div className="p-4">
          <SkeletonTable rows={6} />
        </div>
      </div>
    </div>
  );
}
