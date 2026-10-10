// frontend/src/components/vault/EditBankLogModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PremiumCalendar from '../shared/PremiumCalendar';
import api from '../../config/api';

const NOTE_TIERS = [
    { label: '1,000', value: 1000 },
    { label: '500', value: 500 },
    { label: '200', value: 200 },
    { label: '100', value: 100 },
    { label: '50', value: 50 },
    { label: '20', value: 20 },
    { label: '10', value: 10 },
    { label: '5', value: 5 },
    { label: '1', value: 1 }
];

const EditBankLogModal = ({ isOpen, onClose, logData, onSave }) => {
    const [amount, setAmount] = useState('');
    const [txType, setTxType] = useState('CREDIT');
    
    // Calendar & UI State
    const [selectedDates, setSelectedDates] = useState([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [stockLoading, setStockLoading] = useState(false);
    const [ceoStock, setCeoStock] = useState({});
    const [deltaNotes, setDeltaNotes] = useState(
        NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {})
    );

    const calendarRef = useRef(null);
    const typeDropdownRef = useRef(null);
    const amountInputRef = useRef(null);
    const editNoteRefs = useRef([]);
    const editSubmitBtnRef = useRef(null);

    // Detect if this transaction originated as a physical cash deposit from CEO Vault
    const isCeoDeposit = Boolean(
        logData?.id?.startsWith('BNK-DEP-') || 
        logData?.id?.includes('-DEP-') || 
        (logData?.description || '').toLowerCase().includes('from ceo') || 
        (logData?.description || '').toLowerCase().includes('ceo vault') || 
        logData?.bankDetails?.method === 'DEPOSIT_FROM_CEO_VAULT' ||
        logData?.bankDetails?.fromVault === 'CEO' ||
        Boolean(logData?.linkedExpenseId)
    );

    // Initialize state when modal opens
    useEffect(() => {
        if (logData && isOpen) {
            setAmount(logData.amount || '');
            
            const isCredit = logData.type === 'BANK_MANUAL_CREDIT' || logData.type === 'OUTFLOW';
            setTxType(isCredit ? 'CREDIT' : 'DEBIT');
            
            setDeltaNotes(NOTE_TIERS.reduce((acc, tier) => ({ ...acc, [tier.value]: '' }), {}));

            if (logData.createdAt) {
                const dateStr = logData.createdAt.length === 10 
                    ? logData.createdAt 
                    : new Date(logData.createdAt).toISOString().split('T')[0];
                setSelectedDates([dateStr]);
            }

            if (isCeoDeposit) {
                const fetchCeoStock = async () => {
                    try {
                        setStockLoading(true);
                        const activeBranch = localStorage.getItem('active_branch');
                        if (!activeBranch) return;
                        const res = await api.get(`/api/vault/summary?branchId=${encodeURIComponent(activeBranch)}&vaultType=ceo`);
                        if (res.data && res.data.success) {
                            const stockMap = {};
                            (res.data.data || []).forEach(item => {
                                stockMap[parseFloat(item.denomination_value)] = parseInt(item.total_quantity, 10);
                            });
                            setCeoStock(stockMap);
                        }
                    } catch (err) {
                        console.error("[EditBankLogModal] Error fetching CEO safe stock:", err);
                    } finally {
                        setStockLoading(false);
                    }
                };
                fetchCeoStock();
            }
        } else {
            setIsCalendarOpen(false);
            setIsTypeDropdownOpen(false);
        }
    }, [logData, isOpen, isCeoDeposit]);

    // Handle outside clicks and Escape key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setIsCalendarOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setIsTypeDropdownOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !logData) return null;

    // Delta Calculations
    const originalAmount = parseFloat(logData?.amount || 0);
    const currentAmount = parseFloat(amount || 0);
    const amountDelta = isNaN(currentAmount) ? 0 : currentAmount - originalAmount;
    const isAmountChanged = Math.abs(amountDelta) > 0.01;
    const absDelta = Math.abs(amountDelta);

    // Sum of entered delta notes
    const allocatedNotesTotal = NOTE_TIERS.reduce((sum, tier) => {
        const qty = parseInt(deltaNotes[tier.value], 10) || 0;
        return sum + (qty * tier.value);
    }, 0);

    const isDeltaExactMatch = isAmountChanged && Math.abs(allocatedNotesTotal - absDelta) < 0.01;
    const progressPercent = absDelta > 0 ? Math.min(100, (allocatedNotesTotal / absDelta) * 100) : 0;
    const remainingDelta = Math.max(0, absDelta - allocatedNotesTotal);

    // Denomination input change handler with auto-clamping on stock
    const handleDeltaNoteChange = (denomVal, valStr) => {
        let cleanVal = valStr.replace(/[^0-9]/g, '');
        if (cleanVal === '') {
            setDeltaNotes(prev => ({ ...prev, [denomVal]: '' }));
            return;
        }

        const numQty = parseInt(cleanVal, 10);
        if (amountDelta > 0) {
            const maxStock = ceoStock[denomVal] || 0;
            if (numQty > maxStock) {
                cleanVal = maxStock.toString();
            }
        }
        setDeltaNotes(prev => ({ ...prev, [denomVal]: cleanVal }));
    };

    // 2D Arrow Key Navigation across denomination inputs in Edit Modal
    const handleEditNoteKeyDown = (e, idx) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (idx < NOTE_TIERS.length - 1) {
                editNoteRefs.current[idx + 1]?.focus();
                editNoteRefs.current[idx + 1]?.select?.();
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (idx > 0) {
                editNoteRefs.current[idx - 1]?.focus();
                editNoteRefs.current[idx - 1]?.select?.();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (idx + 3 < NOTE_TIERS.length) {
                editNoteRefs.current[idx + 3]?.focus();
                editNoteRefs.current[idx + 3]?.select?.();
            } else {
                editSubmitBtnRef.current?.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (idx - 3 >= 0) {
                editNoteRefs.current[idx - 3]?.focus();
                editNoteRefs.current[idx - 3]?.select?.();
            } else {
                amountInputRef.current?.focus();
                amountInputRef.current?.select?.();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (idx < NOTE_TIERS.length - 1) {
                editNoteRefs.current[idx + 1]?.focus();
                editNoteRefs.current[idx + 1]?.select?.();
            } else {
                editSubmitBtnRef.current?.focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedDates.length === 0) return; 
        
        if (isCeoDeposit && isAmountChanged && !isDeltaExactMatch) {
            return;
        }

        setLoading(true);
        try {
            await onSave({ 
                logId: logData.id, 
                newAmount: amount, 
                newDate: selectedDates[0],
                newType: isCeoDeposit ? 'CREDIT' : txType,
                deltaDenominations: (isCeoDeposit && isAmountChanged) ? deltaNotes : null
            });
            onClose();
        } catch (error) {
            console.error("Failed to save edit:", error);
        } finally {
            setLoading(false);
        }
    };

    const displayDate = selectedDates.length > 0 
        ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Select Date';

    const isSubmitDisabled = loading || (isCeoDeposit && isAmountChanged && !isDeltaExactMatch);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
            
            {/* Fintech Streamlined Modal Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] border border-slate-100/80 relative max-h-[92vh] overflow-y-auto">
                
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Transaction</h2>
                            {isCeoDeposit && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    CEO Safe
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {logData.id}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Context Description Bar */}
                <div className="mb-5 px-3.5 py-2.5 bg-slate-50/70 rounded-xl border border-slate-100/90 flex items-start gap-2.5 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">Note:</span>
                    <span className="text-slate-600 line-clamp-2 leading-relaxed">{logData.description}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Custom Transaction Type Selector (Hidden for CEO Safe Deposits) */}
                    {!isCeoDeposit && (
                        <div className="relative" ref={typeDropdownRef}>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                Transaction Type
                            </label>
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                                    setIsCalendarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm focus:outline-none ${
                                    isTypeDropdownOpen ? 'border-slate-800 ring-2 ring-slate-800/10' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${txType === 'CREDIT' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    <span className={txType === 'CREDIT' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                        {txType === 'CREDIT' ? 'Credit (+)' : 'Debit (-)'}
                                    </span>
                                </div>
                                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isTypeDropdownOpen && (
                                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 z-50 p-1.5 space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => { setTxType('CREDIT'); setIsTypeDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                                            txType === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Credit (+)</span>
                                        {txType === 'CREDIT' && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setTxType('DEBIT'); setIsTypeDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                                            txType === 'DEBIT' ? 'bg-rose-50 text-rose-700' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Debit (-)</span>
                                        {txType === 'DEBIT' && <span className="text-rose-600 text-xs font-bold">✓</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dual Form Fields: Date & Adjust Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        
                        {/* Transaction Date */}
                        <div className="relative" ref={calendarRef}>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                Transaction Date
                            </label>
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsCalendarOpen(!isCalendarOpen);
                                    setIsTypeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm focus:outline-none ${
                                    isCalendarOpen ? 'border-slate-800 ring-2 ring-slate-800/10 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{displayDate}</span>
                                </div>
                                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isCalendarOpen && (
                                <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 animate-in slide-in-from-top-2 fade-in duration-150">
                                    <PremiumCalendar 
                                        isOpen={true} 
                                        onClose={() => setIsCalendarOpen(false)} 
                                        selectedDates={selectedDates}
                                        onDateSelect={(dates) => {
                                            setSelectedDates(dates.length > 0 ? [dates[dates.length - 1]] : []);
                                            setIsCalendarOpen(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Adjust Amount */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    Adjust Amount
                                </label>
                                {isCeoDeposit && originalAmount > 0 && (
                                    <span className="text-[10px] font-medium text-slate-400">
                                        Was: AED {originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                                    AED
                                </span>
                                <input 
                                    ref={amountInputRef}
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 transition-all shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                            if (isCeoDeposit && isAmountChanged) {
                                                e.preventDefault();
                                                editNoteRefs.current[0]?.focus();
                                                editNoteRefs.current[0]?.select?.();
                                            }
                                        }
                                    }}
                                    required 
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FINTECH DENOMINATION RE-ALIGNMENT PANEL */}
                    {isCeoDeposit && isAmountChanged && (
                        <div className="bg-[#FAFBFD] rounded-2xl p-4 border border-slate-200/70 space-y-3.5 transition-all">
                            
                            {/* Unified Header & Status Meter */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                                            amountDelta > 0 
                                                ? 'bg-amber-100/90 text-amber-800 border border-amber-200/50' 
                                                : 'bg-indigo-100/90 text-indigo-800 border border-indigo-200/50'
                                        }`}>
                                            {amountDelta > 0 ? 'Deduct Notes' : 'Return Notes'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800">
                                            AED {absDelta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    {/* Real-time Match Indicator */}
                                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        isDeltaExactMatch 
                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                                            : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                    }`}>
                                        {isDeltaExactMatch ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                <span>Exact Match</span>
                                            </>
                                        ) : (
                                            <span>AED {allocatedNotesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {absDelta.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Slim Fintech Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${isDeltaExactMatch ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Integrated 3x3 Tile Grid (Single-Surface Design) */}
                            <div className="grid grid-cols-3 gap-2">
                                {NOTE_TIERS.map((tier, idx) => {
                                    const stock = ceoStock[tier.value] || 0;
                                    const count = deltaNotes[tier.value] || '';
                                    const hasValue = count && parseInt(count, 10) > 0;
                                    const isOutOfStock = amountDelta > 0 && stock <= 0;

                                    return (
                                        <div 
                                            key={tier.value}
                                            className={`relative rounded-xl p-2.5 transition-all border ${
                                                isOutOfStock
                                                    ? 'bg-slate-100/60 border-slate-200/50 opacity-60'
                                                    : hasValue 
                                                        ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/10' 
                                                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {tier.label}
                                                </span>
                                                <span className={`text-[9px] font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {stock} safe
                                                </span>
                                            </div>
                                            
                                            {/* Integrated Borderless Clean Input */}
                                            <input
                                                ref={el => editNoteRefs.current[idx] = el}
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="0"
                                                disabled={isOutOfStock}
                                                value={count}
                                                onChange={(e) => handleDeltaNoteChange(tier.value, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                onKeyDown={(e) => handleEditNoteKeyDown(e, idx)}
                                                className={`w-full text-center py-1 rounded-lg text-sm font-bold transition-all outline-none ${
                                                    isOutOfStock 
                                                        ? 'bg-transparent text-slate-300 cursor-not-allowed'
                                                        : hasValue
                                                            ? 'bg-emerald-50/50 text-emerald-900'
                                                            : 'bg-slate-50/80 text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800/20'
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Quick Sync Link */}
                            {allocatedNotesTotal > 0 && Math.abs(allocatedNotesTotal - absDelta) > 0.01 && (
                                <div className="flex justify-between items-center pt-0.5 text-[11px]">
                                    <span className="text-slate-400 font-medium">
                                        Remaining: <strong className="text-slate-700">AED {remainingDelta.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const syncedAmount = amountDelta > 0 
                                                ? originalAmount + allocatedNotesTotal 
                                                : Math.max(0, originalAmount - allocatedNotesTotal);
                                            setAmount(syncedAmount.toString());
                                        }}
                                        className="text-slate-700 hover:text-slate-900 font-semibold underline underline-offset-2 transition-colors"
                                    >
                                        Auto-sync to AED {(amountDelta > 0 ? originalAmount + allocatedNotesTotal : originalAmount - allocatedNotesTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs sm:text-sm focus:outline-none"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            ref={editSubmitBtnRef}
                            type="submit" 
                            disabled={isSubmitDisabled} 
                            className={`flex-1 py-2.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm ${
                                isSubmitDisabled 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            }`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : isSubmitDisabled && isCeoDeposit && isAmountChanged ? (
                                `Balance Notes Required`
                            ) : (
                                `Confirm & Save Changes`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditBankLogModal;