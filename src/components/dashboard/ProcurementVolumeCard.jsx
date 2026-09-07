// frontend/src/components/dashboard/ProcurementVolumeCard.jsx
import React, { useState } from 'react';

export default function ProcurementVolumeCard({ procurementStats }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const vendors = procurementStats?.vendors || [];
  const totalValue = procurementStats?.totalProcurementValue || 0;
  const totalOrders = procurementStats?.totalOrders || 0;

  // Format compact currency (e.g., 497.3K AED)
  const formatCompact = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(2) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // SVG Donut Calculations
  const radius = 62;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dasharray and dashoffset for each slice
  let accumulatedOffset = 0;
  const slices = vendors.map((vendor, index) => {
    const fraction = totalValue > 0 ? (vendor.amount / totalValue) : 0;
    const strokeLength = fraction * circumference;
    // Add 2px visual gap between segments if multiple slices
    const gap = vendors.length > 1 && strokeLength > 4 ? 3 : 0;
    const effectiveLength = Math.max(0, strokeLength - gap);
    const dashArray = `${effectiveLength} ${circumference - effectiveLength}`;
    const dashOffset = -accumulatedOffset;

    accumulatedOffset += strokeLength;

    return {
      ...vendor,
      dashArray,
      dashOffset,
      index
    };
  });

  return (
    <div className="lg:col-span-5 bg-white rounded-[2rem] p-7 md:p-8 border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between">
      
      {/* 1. Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Procurement Volume</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-light">LPO purchase order distribution</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-700 tracking-tight">
            {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'}
          </span>
        </div>
      </div>

      {/* 2. Donut Chart & Center Metrics */}
      {vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-600">No LPO records yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Orders generated in LPO Generator will show here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Donut Visual with Center Metric */}
          <div className="relative flex items-center justify-center py-2">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Dynamic Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                return (
                  <circle
                    key={slice.id || slice.index}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.hex || '#0F172A'}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Total Value
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs font-medium text-slate-400">AED</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatCompact(totalValue)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-100/60">
                100% Procurement
              </span>
            </div>
          </div>

          {/* 3. Vendor Breakdown List (Index / Legend) */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100/80">
            {vendors.map((vendor, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={vendor.id || index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isHovered ? 'bg-slate-50 shadow-sm ring-1 ring-slate-200/60' : 'bg-transparent hover:bg-slate-50/60'
                  }`}
                >
                  {/* Top Row: Color & Name vs Valuation & Pct */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: vendor.hex || '#0F172A' }}
                      ></span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 truncate tracking-tight text-[12px]">
                          {vendor.vendorName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {vendor.orderCount} {vendor.orderCount === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[12px] font-bold text-slate-900">
                        AED {vendor.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                        {vendor.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${vendor.color || 'bg-slate-900'} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min(100, Math.max(2, vendor.percentage))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
