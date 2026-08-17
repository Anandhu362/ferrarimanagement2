import React from 'react';

export default function VendorTable({ data, isLoading, onEdit, onDelete }) {
  // Helper to format the ISO date into a clean, readable string (e.g., "17 Aug 2026")
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  // Modern Skeleton Loader for the initial data fetch
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto animate-pulse">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              {['Vendor ID', 'Vendor Name', 'Payee Details', 'Added Date', 'Actions'].map((header, idx) => (
                <th key={idx} className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-300 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((skeleton) => (
              <tr key={skeleton} className="border-b border-slate-50">
                <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                <td className="py-4 px-6"><div className="h-4 bg-slate-100 rounded w-12 ml-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Vendor ID</th>
            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Vendor Name</th>
            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Payee Details</th>
            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Added Date</th>
            <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((vendor) => (
            <tr 
              key={vendor.vendor_id} 
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-200 group"
            >
              <td className="py-4 px-6">
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  {vendor.vendor_id}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm font-semibold text-slate-900">
                  {vendor.vendorName}
                </span>
              </td>
              <td className="py-4 px-6">
                <div 
                  className="text-sm text-slate-600 max-w-[250px] truncate" 
                  title={vendor.payeeDetails}
                >
                  {vendor.payeeDetails}
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="text-xs font-medium text-slate-500">
                  {formatDate(vendor.created_at)}
                </span>
              </td>
              
              {/* Actions Column */}
              <td className="py-4 px-6">
                {/* 
                  Removed opacity-0 and group-hover:opacity-100 to make icons always visible.
                */}
                <div className="flex items-center justify-end gap-2 transition-opacity duration-200">
                  <button 
                    onClick={() => onEdit(vendor)} 
                    className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-lg transition-all shadow-sm hover:shadow" 
                    title="Edit Vendor"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onDelete(vendor.vendor_id)} 
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm hover:shadow" 
                    title="Delete Vendor"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}