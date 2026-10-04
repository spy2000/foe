"use client";

import React from "react";

export function SkeletonInput({ label = true }: { label?: boolean }) {
  return (
    <div className="space-y-1.5 animate-pulse">
      {label && <div className="h-3.5 w-28 bg-gray-200 rounded" />}
      <div className="h-10 w-full bg-gray-200/80 rounded-xl" />
    </div>
  );
}

export function SkeletonSection({
  title = true,
  rows = 2,
  cols = 2,
}: {
  title?: boolean;
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs animate-pulse space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </div>
      )}
      <div
        className={`grid gap-4 ${
          cols === 1
            ? "grid-cols-1"
            : cols === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <SkeletonInput key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SkeletonForm() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-100" />
        </div>
      </div>

      {/* Sections Skeleton */}
      <div className="space-y-6">
        <SkeletonSection rows={2} cols={3} />
        <SkeletonSection rows={2} cols={2} />
        <SkeletonSection rows={2} cols={3} />
        <SkeletonSection rows={1} cols={2} />
      </div>
    </div>
  );
}
