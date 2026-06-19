// frontend/src/components/orders/OrderReviewQueue.jsx
import React, { useMemo } from 'react';

export default function OrderReviewQueue({ queue, onRemove, onSubmit, isSubmitting }) {
  const isEmpty = !queue || queue.length === 0;

  // Helper to format the delivery date nicely before submission
  const formatDeliveryDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // ✅ VISUAL BATCHING LOGIC: Group queue items by Company and Delivery Date
  const groupedQueue = useMemo(() => {
    if (isEmpty) return [];
    
    const groupsMap = new Map();
    queue.forEach(item => {
      // Create a unique key for grouping
      const key = `${(item.companyName || '').trim()}_${item.deliveryDate}`;
      
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          companyName: item.companyName,
          date: item.date,
          deliveryDate: item.deliveryDate,
          location: item.location,
          phone: item.phone,
          products: [] // Array to hold multiple items for this group
        });
      }
      groupsMap.get(key).products.push(item);
    });
    
    return Array.from(groupsMap.values());
  }, [queue, isEmpty]);

  return (
    <div className="mt-8 bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-300">
      
      {/* Header - Always Persistent to anchor the layout */}
      <div className="p-6 md:px-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">3. Order Verification Queue</h3>
          <p className="text-xs text-slate-400 mt-1 font-light">Review full client and product details before bulk syncing.</p>
        </div>
        <span className={`text-[11px] px-4 py-1.5 rounded-full font-bold tracking-wider border transition-colors duration-300 ${
          !isEmpty 
            ? 'bg-brand-light/10 text-brand-dark border-brand-light/20' 
            : 'bg-slate-50 text-slate-400 border-slate-200'
        }`}>
          {queue?.length || 0} {queue?.length === 1 ? 'ITEM' : 'ITEMS'} READY
        </span>
      </div>

      {/* Dynamic Content Area with Smooth Fading */}
      <div className="relative bg-white">
        {isEmpty ? (
          /* Premium Empty State */
          <div className="py-20 px-6 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600 tracking-tight">No orders in the queue</p>
            <p className="text-xs text-slate-400 mt-1 font-light">Add products from the section above to begin batching.</p>
          </div>
        ) : (
          /* Populated Table State */
          <div className="animate-in fade-in duration-500">
            {/* Horizontal Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 md:px-8 py-4">Client & Dates</th>
                    <th className="px-6 py-4">Delivery Info</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4 text-center">Weight</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 md:px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  
                  {/* Map over the Groups first, then the items inside them */}
                  {groupedQueue.map((group, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                      {group.products.map((item, itemIndex) => {
                        const isFirstInGroup = itemIndex === 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group/row">
                            
                            {/* Client Info & Dates - Only render on the FIRST row of the group and span downward */}
                            {isFirstInGroup && (
                              <td rowSpan={group.products.length} className="px-6 md:px-8 py-4 align-top bg-white border-r border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{group.companyName || '—'}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500" title="Order Date">Ord: {group.date || '—'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[10px] font-medium text-brand-dark" title="Delivery Date">Del: {formatDeliveryDate(group.deliveryDate)}</span>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* Delivery Info - Only render on the FIRST row of the group */}
                            {isFirstInGroup && (
                              <td rowSpan={group.products.length} className="px-6 py-4 align-top bg-white border-r border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-700 truncate max-w-[200px]" title={group.location || '—'}>
                                    {group.location || '—'}
                                  </span>
                                  <span className="text-[11px] text-slate-500 mt-0.5">{group.phone || '—'}</span>
                                </div>
                              </td>
                            )}

                            {/* Product Info - Always render */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-brand-light shrink-0"></span>
                                <span className="font-semibold text-slate-800">{item.product || '—'}</span>
                              </div>
                            </td>

                            {/* Specs - Always render */}
                            <td className="px-6 py-4 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide">
                                {item.weight || '—'}
                              </span>
                            </td>
                            
                            {/* Quantity - Always render */}
                            <td className="px-6 py-4 text-center">
                              <span className="text-brand-dark font-bold text-lg">{item.qty ? Number(item.qty).toLocaleString() : 0}</span>
                            </td>

                            {/* Action - Always render */}
                            <td className="px-6 md:px-8 py-4 text-center">
                              <button 
                                onClick={() => onRemove(item.id)}
                                className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                title="Remove Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}

                </tbody>
              </table>
            </div>

            {/* Footer Action Area */}
            <div className="p-6 md:px-8 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-4">
              <button 
                onClick={onSubmit}
                disabled={isSubmitting}
                className={`px-8 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 ${
                  !isSubmitting
                    ? 'bg-slate-900 text-white hover:bg-brand-dark hover:shadow-md' 
                    : 'bg-slate-300 text-slate-500 cursor-wait'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Pushing to Ledger...
                  </>
                ) : (
                  <>
                    Confirm & Push Orders
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}