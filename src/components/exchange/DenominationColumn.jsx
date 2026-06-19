import React from 'react';

export default function DenominationColumn({
  title,
  subtitle,
  titleColorClass,
  hoverBgClass,
  focusBorderClass,
  denominations,
  notesData,
  onChange,
  onClear,
  showAvailable = false,
  vaultStock = {}
}) {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-sm font-semibold tracking-widest uppercase ${titleColorClass}`}>
            {title}
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
            {subtitle}
          </p>
        </div>
        <button 
          onClick={onClear} 
          className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Inputs List */}
      <div className="space-y-4">
        {denominations.map((tier) => {
          const stock = vaultStock[tier.value] || 0;
          const isZeroStock = showAvailable && stock === 0;

          return (
            <div 
              key={`${title}-${tier.value}`} 
              className={`flex items-center justify-between p-3 rounded-2xl border border-slate-100 transition-all ${hoverBgClass}`}
            >
              <span className="font-medium text-slate-700">{tier.label}</span>
              
              <div className="flex items-center gap-3">
                {/* Available Stock Indicator (Only for 'Notes Taken') */}
                {showAvailable && (
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400 uppercase">Avail</div>
                    <div className="text-xs font-semibold text-slate-900">{stock}</div>
                  </div>
                )}
                
                {/* Input Field */}
                <input 
                  type="text"
                  placeholder="0"
                  value={notesData[tier.value]}
                  onChange={(e) => onChange(tier.value, e.target.value)}
                  disabled={isZeroStock}
                  className={`w-16 px-2 py-1.5 bg-white border rounded-lg text-center font-medium outline-none transition-colors
                    ${isZeroStock 
                      ? 'bg-rose-50/30 text-rose-300 border-rose-100' 
                      : `border-slate-200 text-slate-900 ${focusBorderClass}`
                    }
                  `}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}