import React from 'react';

export default function InventoryTable({ data = [], isLoading, onEdit, onDelete }) {
  
  if (isLoading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-brand-light mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-400 font-medium tracking-wide">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4 min-h-[450px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full">
      <table className="w-full text-left border-collapse whitespace-nowrap relative">
        
        <thead>
          <tr className="border-b border-slate-200/60 bg-slate-100/30">
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px]">Inventory ID</th>
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[250px]">Product Name</th>
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px]">Weight</th>
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px] text-right">Stock QTY</th>
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[150px] text-center">Status</th>
            <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[120px] text-center">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100/80 text-sm">
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">No products found in inventory.</p>
                  <p className="text-slate-400 text-xs mt-1">Click 'Add New Product' to get started.</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => {
              // Ensure we are working with safe numbers to prevent crash if data is malformed
              const safeQty = Number(item.qty || 0);
              
              // Determine stock status for premium UI badges
              const isLowStock = safeQty > 0 && safeQty < 50;
              const isOutOfStock = safeQty === 0;

              return (
                <tr key={item.inv_id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-mono text-xs text-slate-500">{item.inv_id}</td>
                  <td className="p-5 font-semibold text-slate-900">{item.product_name || '—'}</td>
                  
                  <td className="p-5 text-slate-600 font-medium">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border border-slate-200/60">
                      {item.weight || '—'}
                    </span>
                  </td>
                  
                  <td className="p-5 text-right font-semibold text-slate-900 text-base">
                    {safeQty.toLocaleString()}
                  </td>
                  
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide border ${
                      isOutOfStock 
                        ? 'bg-rose-50 text-rose-600 border-rose-100/50' 
                        : isLowStock 
                          ? 'bg-amber-50 text-amber-600 border-amber-100/50'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                    }`}>
                      {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                  </td>

                  <td className="p-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-50 hover:text-brand-dark transition-all duration-200"
                        title="Edit Product"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onDelete(item.inv_id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all duration-200"
                        title="Delete Product"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}