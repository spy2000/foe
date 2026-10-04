"use client";

import React from "react";

export default function SkeletonTable({
  rows = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full min-w-[960px] table-auto divide-y divide-gray-200 text-left text-xs">
        <thead className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <tr>
            <th className="w-[80px] min-w-[80px] px-4 py-3">Photo</th>
            <th className="w-[110px] min-w-[110px] px-4 py-3 whitespace-nowrap">Member ID</th>
            <th className="min-w-[180px] px-4 py-3">Full Name</th>
            <th className="min-w-[160px] px-4 py-3">Designation</th>
            <th className="w-[130px] min-w-[130px] px-4 py-3 whitespace-nowrap">Contact</th>
            <th className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">Blood Group</th>
            <th className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">Status</th>
            <th className="w-[180px] min-w-[180px] px-4 py-3 text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {/* Photo */}
              <td className="w-[80px] min-w-[80px] px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
              </td>

              {/* Member ID */}
              <td className="w-[110px] min-w-[110px] px-4 py-3 whitespace-nowrap">
                <div className="h-4 w-14 rounded bg-gray-200" />
              </td>

              {/* Full Name */}
              <td className="min-w-[180px] px-4 py-3">
                <div className="h-4 w-36 rounded bg-gray-200" />
              </td>

              {/* Designation */}
              <td className="min-w-[160px] px-4 py-3">
                <div className="h-4 w-32 rounded bg-gray-200" />
              </td>

              {/* Contact */}
              <td className="w-[130px] min-w-[130px] px-4 py-3 whitespace-nowrap">
                <div className="h-4 w-28 rounded bg-gray-200" />
              </td>

              {/* Blood Group */}
              <td className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">
                <div className="h-6 w-10 rounded-lg bg-gray-200" />
              </td>

              {/* Status */}
              <td className="w-[100px] min-w-[100px] px-4 py-3 whitespace-nowrap">
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </td>

              {/* Actions */}
              <td className="w-[180px] min-w-[180px] px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                  <div className="h-7 w-12 rounded-lg bg-gray-200" />
                  <div className="h-7 w-16 rounded-lg bg-gray-200" />
                  <div className="h-7 w-7 rounded-lg bg-gray-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
