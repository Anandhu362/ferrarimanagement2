import React from 'react';

// Added fallback 'order' prop in case the parent component hasn't been fully renamed yet
export default function OrderTripCard({ item, order, onDragStart, sourceId }) {
  // Use 'item' if passed, otherwise fallback to 'order'
  const data = item || order;

  // Extract a shorter ID for a cleaner UI. 
  // Since items now have IDs like 'ORD-123456-item-0', we extract the base order ID.
  const displayId = data?.orderId 
    ? data.orderId.split('-').pop() 
    : (data?.id ? data.id.split('-').pop() : 'N/A');

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, data.id, sourceId)}
      className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-brand-light/40 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col min-h-fit"
    >
      {/* Decorative hover line indicator on the left edge */}
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-light/20 group-hover:bg-brand-light transition-colors"></div>
      
      {/* Header: Order ID and Location Badge */}
      <div className="flex justify-between items-start mb-2 pl-2 w-full">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          #{displayId}
        </span>
        {data?.delivery_location ? (
          <span 
            className="text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded truncate max-w-[110px]"
            title={data.delivery_location}
          >
            {data.delivery_location}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Confirmed
          </div>
        )}
      </div>
      
      {/* Body: Customer Name */}
      <h4 
        className="text-[13px] leading-snug font-bold text-slate-900 mb-1 pl-2 break-words w-full pr-2" 
        title={data?.company_name || 'Unknown Company'}
      >
        {data?.company_name || 'Unknown Company'}
      </h4>

      {/* NEW: Specific Product & Weight Details */}
      <p className="text-xs text-slate-500 pl-2 mb-4 flex items-center flex-wrap gap-1.5">
        <span className="truncate max-w-[160px]" title={data?.product}>{data?.product || 'Unknown Product'}</span>
        {data?.weight && (
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
            {data.weight}
          </span>
        )}
      </p>
      
      {/* Footer: Contact Info and Remaining Capacity (Bags) */}
      <div className="flex justify-between items-end mt-auto pt-3 border-t border-slate-50 pl-2 w-full">
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
          {data?.phone_number || 'No contact info'}
        </span>
        <div className="bg-brand-bg text-brand-dark px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-brand-light/10 shrink-0">
          {data?.totalQty || 0} <span className="text-[10px] font-medium opacity-70">Bags</span>
        </div>
      </div>
    </div>
  );
}