"use client";

import React from "react";

export default function SkeletonCard() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 animate-pulse">
      {/* Front Card Skeleton */}
      <div
        className="relative overflow-hidden rounded-[24px] bg-white border border-gray-200 shadow-xl flex flex-col justify-between"
        style={{ width: "350px", height: "550px" }}
      >
        {/* Header Curve area */}
        <div className="h-[145px] w-full bg-gray-200" />

        {/* Photo Box overlapping */}
        <div className="relative -mt-12 flex justify-center">
          <div className="h-32 w-28 rounded-2xl bg-gray-300 border-4 border-white shadow-sm" />
        </div>

        {/* Name and Designation */}
        <div className="flex flex-col items-center gap-2 px-6 mt-2">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-3.5 w-32 rounded bg-gray-100" />
        </div>

        {/* Details Table */}
        <div className="px-8 space-y-2.5">
          <div className="h-3.5 w-full rounded bg-gray-100" />
          <div className="h-3.5 w-5/6 rounded bg-gray-100" />
          <div className="h-3.5 w-4/6 rounded bg-gray-100" />
          <div className="h-3.5 w-5/6 rounded bg-gray-100" />
        </div>

        {/* Signature & Bottom bar */}
        <div className="px-8 flex justify-end">
          <div className="h-7 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-7 w-full bg-gray-200" />
      </div>

      {/* Back Card Skeleton */}
      <div
        className="relative overflow-hidden rounded-[24px] bg-white border border-gray-200 shadow-xl flex flex-col justify-between"
        style={{ width: "350px", height: "550px" }}
      >
        <div className="h-[115px] w-full bg-gray-200" />
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-5/6 rounded bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-44 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        </div>
        <div className="h-7 w-full bg-gray-200" />
      </div>
    </div>
  );
}
