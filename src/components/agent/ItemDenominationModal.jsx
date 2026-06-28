import React, { useState, useEffect } from 'react';

export default function ItemDenominationModal({ amount, initialDenominations, onSave, onClose }) {
  const denomList = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

  // Initialize state with existing denominations if editing, otherwise empty
  const [denominations, setDenominations] = useState(() => {
    if (initialDenominations && Object.keys(initialDenominations).length > 0) {
      return { ...initialDenominations };
    }
    return denomList.reduce((acc, val) => ({ ...acc, [val]: '' }), {});
  });

  const [currentSum, setCurrentSum] = useState(0);

  // Live calculation hook
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

  // Prevent users from typing 'e', '-', or '.' in the integer count fields
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
    // Glassmorphism wrapper that expands smoothly below the parent card
    <div className="mt-3 p-5 bg-white/60 backdrop-blur-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] relative overflow-hidden transition-all duration-300 ease-in-out">
      
      {/* Subtle top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80"></div>

      {/* Header & Status Pill */}
      <div className="flex justify-between items-center mb-5 mt-1">
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">Verify Item Notes</h4>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Target: AED {targetAmount.toFixed(2)}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border ${
          isBalanced 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
            : 'bg-amber-50 border-amber-200 text-amber-600'
        } text-[10px] sm:text-xs font-bold shadow-sm transition-colors`}>
          {isBalanced ? 'Amount Matched' : `Pending: AED ${remaining.toFixed(2)}`}
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="w-full bg-slate-200/60 rounded-full h-1.5 mb-6 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${isBalanced ? 'bg-emerald-500' : 'bg-amber-400'}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Note Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {denomList.map((val) => (
          <div key={val} className="flex items-center justify-between p-2.5 sm:p-3 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200/50 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-6 sm:w-9 sm:h-7 bg-slate-50 rounded flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600">💵</span>
              </div>
              <span className="font-bold text-slate-700 text-xs sm:text-sm">{val}</span>
            </div>

            <div className="flex items-center">
              <input
                type="number"
                min="0"
                step="1"
                value={denominations[val] || ''}
                onChange={(e) => handleCountChange(val, e.target.value)}
                onKeyDown={blockInvalidChars}
                className="w-14 sm:w-16 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300 text-xs sm:text-sm"
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(denominations)}
          disabled={!isBalanced}
          className={`flex-[2] py-3.5 px-4 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
            isBalanced
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          {isBalanced ? (
            <>
              Lock Notes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </>
          ) : (
            'Match Exact Amount'
          )}
        </button>
      </div>
    </div>
  );
}