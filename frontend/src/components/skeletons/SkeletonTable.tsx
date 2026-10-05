"use client";

import React from "react";

export default function SkeletonTable({
  rows = 6,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full min-w-[950px] table-fixed divide-y divide-gray-200 text-left text-xs">
        <thead className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <tr>
            <th className="w-[48px] px-4 py-3 text-center whitespace-nowrap">
              <div className="h-4 w-4 rounded bg-gray-200 mx-auto" />
            </th>
            <th className="w-[70px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Photo</th>
            <th className="w-[100px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Member ID</th>
            <th className="w-[180px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Full Name</th>
            <th className="w-[160px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Designation</th>
            <th className="w-[140px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
            <th className="w-[110px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Blood Group</th>
            <th className="w-[110px] px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
            <th className="w-[140px] px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              {/* Checkbox */}
              <td className="w-[48px] px-4 py-3 text-center">
                <div className="h-4 w-4 rounded bg-gray-200 mx-auto" />
              </td>

              {/* Photo */}
              <td className="w-[70px] px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-gray-200" />
              </td>

              {/* Member ID */}
              <td className="w-[100px] px-4 py-3 whitespace-nowrap">
                <div className="h-4 w-14 rounded bg-gray-200" />
              </td>

              {/* Full Name */}
              <td className="w-[180px] px-4 py-3">
                <div className="h-4 w-36 rounded bg-gray-200" />
              </td>

              {/* Designation */}
              <td className="w-[160px] px-4 py-3">
                <div className="h-4 w-32 rounded bg-gray-200" />
              </td>

              {/* Contact */}
              <td className="w-[140px] px-4 py-3 whitespace-nowrap">
                <div className="h-4 w-28 rounded bg-gray-200" />
              </td>

              {/* Blood Group */}
              <td className="w-[110px] px-4 py-3 whitespace-nowrap">
                <div className="h-6 w-10 rounded-lg bg-gray-200" />
              </td>

              {/* Status */}
              <td className="w-[110px] px-4 py-3 whitespace-nowrap">
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </td>

              {/* Actions */}
              <td className="w-[140px] px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-8 w-8 rounded-md bg-gray-200" />
                  <div className="h-8 w-8 rounded-md bg-gray-200" />
                  <div className="h-8 w-8 rounded-md bg-gray-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
