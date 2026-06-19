import React from 'react';
import OrderTripCard from './OrderTripCard';

export default function DispatchColumn({ 
  id, 
  title, 
  type, 
  items = [], // Changed from 'orders' to 'items' to reflect line-item granularity
  currentLoad = 0, 
  maxCapacity = 0, 
  onDrop, 
  onDragStart 
}) {
  
  const isTrip = type === 'trip';
  const isOverloaded = isTrip && currentLoad > maxCapacity;
  // Fallback to 0 if maxCapacity is falsy to prevent Infinity/NaN in UI
  const capacityNum = parseInt(maxCapacity || '0', 10);
  const loadPercentage = isTrip && capacityNum > 0 ? Math.min(100, (currentLoad / capacityNum) * 100) : (isTrip ? 100 : 0);

  // Base classes for the column container
  const baseClasses = "rounded-[2rem] p-6 h-[650px] flex flex-col transition-colors";
  
  // Specific classes based on column type and state
  const typeClasses = isTrip
    ? `min-w-[320px] bg-white border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isOverloaded ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'}`
    : `bg-slate-50/50 border border-slate-200 shadow-inner`;

  return (
    <div 
      className={`${baseClasses} ${typeClasses}`}
      onDragOver={(e) => e.preventDefault()} 
      onDrop={(e) => onDrop(e, id)}
    >
      {/* --- COLUMN HEADER --- */}
      {isTrip ? (
        <div className="mb-5 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isOverloaded ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </div>
          </div>
          
          {/* Capacity Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className={isOverloaded ? 'text-rose-600' : 'text-slate-500'}>
                Load: {currentLoad}
              </span>
              <span className="text-slate-400">Max: {maxCapacity || '∞'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isOverloaded ? 'bg-rose-500' : (currentLoad === capacityNum && capacityNum > 0) ? 'bg-emerald-500' : 'bg-brand-light'}`}
                style={{ width: `${loadPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 tracking-widest uppercase">{title}</h3>
          <span className="bg-brand-dark text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {items.length}
          </span>
        </div>
      )}

      {/* --- COLUMN BODY (DRAG & DROP AREA) --- */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            {isTrip ? (
              <>
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                <p className="text-sm font-medium">Drop items here</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                <p className="text-sm font-medium">All items assigned</p>
              </>
            )}
          </div>
        ) : (
          items.map(item => (
            <OrderTripCard 
              key={item.id} 
              item={item} // Passes the correctly structured 'item' object
              onDragStart={onDragStart} 
              sourceId={id} 
            />
          ))
        )}
      </div>
    </div>
  );
}