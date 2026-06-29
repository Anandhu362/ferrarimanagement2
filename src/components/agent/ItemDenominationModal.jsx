import React, { useState, useEffect } from 'react';

export default function ItemDenominationModal({ amount, initialDenominations, onSave, onClose }) {
  const denomList = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

  const [denominations, setDenominations] = useState(() => {
    if (initialDenominations && Object.keys(initialDenominations).length > 0) {
      return { ...initialDenominations };
    }
    return denomList.reduce((acc, val) => ({ ...acc, [val]: '' }), {});
  });

  const [currentSum, setCurrentSum] = useState(0);

  useEffect(() => {
    const sum = Object.entries(denominations).reduce((acc, [val, count]) => {
      const numCount = parseInt(count) || 0;
      return acc + (parseFloat(val) * numCount);
    }, 0);
    setCurrentSum(sum);
  }, [denominations]);

  const handleCountChange = (val, newCount) => {
    setDenominations(prev => ({
      ...prev,
      [val]: newCount
    }));
  };

  const blockInvalidChars = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const targetAmount = parseFloat(amount);
  const isBalanced = currentSum === targetAmount;
  const remaining = targetAmount - currentSum;
  const progressPercentage = Math.min((currentSum / targetAmount) * 100, 100) || 0;

  return (
    // 1. Fixed Backdrop Overlay - Now strictly centered (items-center) with padding (p-4)
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300"
      onClick={onClose} // Clicking outside closes the modal
    >
      
      {/* 2. Modal Container - Now always a centered floating card (rounded-3xl) */}
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing it
      >
        
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

        {/* 3. Header Section (Sticky) */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex-shrink-0 mt-1 relative">
          
          {/* NEW: Close Icon (X) */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header Content - Added pr-8 to prevent text from overlapping the X button */}
          <div className="flex justify-between items-start gap-2 pr-8">
            <div>
              <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Verify Item Notes</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Target: AED {targetAmount.toFixed(2)}
              </p>
            </div>
            
            <div className={`px-3 py-1.5 rounded-xl border ${
              isBalanced 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
            } text-xs font-bold shadow-sm text-center`}>
              {isBalanced ? 'Matched' : `Pending:\nAED ${remaining.toFixed(2)}`}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${isBalanced ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* 4. Scrollable Body Section */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {denomList.map((val) => (
              <div key={val} className="flex items-center justify-between p-2 sm:p-3 bg-white border border-slate-200/60 rounded-2xl hover:border-emerald-300 transition-all shadow-sm">
                
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <div className="w-8 h-7 sm:w-10 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                    <span className="text-xs sm:text-sm">💵</span>
                  </div>
                  <span className="font-bold text-slate-700 text-sm sm:text-base">{val}</span>
                </div>

                <div className="flex items-center shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={denominations[val] || ''}
                    onChange={(e) => handleCountChange(val, e.target.value)}
                    onKeyDown={blockInvalidChars}
                    className="w-14 sm:w-16 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-300 text-base shadow-inner"
                    placeholder="0"
                  />
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 5. Footer / Actions Section (Sticky) */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex-shrink-0 rounded-b-3xl flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm sm:text-base rounded-xl border border-slate-200 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(denominations)}
            className={`flex-[2] py-3.5 px-4 font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              isBalanced
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
            }`}
          >
            {isBalanced ? (
              <>
                Lock Notes
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </>
            ) : (
              'Save Physical Notes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}