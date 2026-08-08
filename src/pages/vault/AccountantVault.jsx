// frontend/src/pages/vault/AccountantVault.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api'; 
import { db } from '../../config/firebase'; // ✅ Import initialized Firebase db
import { collection, onSnapshot } from 'firebase/firestore'; // ✅ Import Firestore real-time functions

const DENOMINATION_TIERS = [
  { value: 1000, label: '1,000 AED', type: 'note' },
  { value: 500, label: '500 AED', type: 'note' },
  { value: 200, label: '200 AED', type: 'note' },
  { value: 100, label: '100 AED', type: 'note' },
  { value: 50, label: '50 AED', type: 'note' },
  { value: 20, label: '20 AED', type: 'note' },
  { value: 10, label: '10 AED', type: 'note' },
  { value: 5, label: '5 AED', type: 'note' },
  { value: 1, label: 'Mixed Coins', type: 'coin' },
];

export default function AccountantVault() {
  const navigate = useNavigate();
  const [vaultData, setVaultData] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  // Modals State
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    const activeBranch = localStorage.getItem('active_branch');
    if (!activeBranch) return;
    
    // ✅ 1. Point directly to the live Firestore collection
    const tempVaultRef = collection(db, 'branches', activeBranch, 'temp_vault_inventory');

    // ✅ 2. Attach the real-time websocket listener
    const unsubscribe = onSnapshot(tempVaultRef, (snapshot) => {
      let currentTotal = 0;
      const liveDocs = [];
      
      // Extract data from the live snapshot
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.quantity > 0) {
          liveDocs.push(data);
        }
      });

      // Map the live data onto your standard UI tiers
      const mergedData = DENOMINATION_TIERS.map(tier => {
        const dbMatch = liveDocs.find(row => parseFloat(row.denomination_value) === tier.value);
        const qty = dbMatch ? parseInt(dbMatch.quantity) : 0;
        const totalValue = qty * tier.value;
        
        currentTotal += totalValue;

        return { ...tier, qty, totalValue };
      });

      setTotalBalance(currentTotal);
      setVaultData(mergedData);
      setLoading(false);
    }, (error) => {
      console.error("❌ Firestore Sync Error:", error);
      setLoading(false);
    });

    // ✅ 3. Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const confirmTransfer = async () => {
    setIsTransferring(true);
    setShowConfirmDialog(false);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) {
        setStatusModal({ isOpen: true, type: 'error', message: 'Active branch is missing. Please log in again.' });
        return;
      }
      
      // We still POST to the backend so the secure transaction and BigQuery outbox logging happens
      const response = await api.post('/api/accountant-vault/transfer', { 
        branchId: activeBranch 
      });

      const result = response.data; 

      if (result.success) {
        setStatusModal({ 
          isOpen: true, 
          type: 'success', 
          message: result.message || 'Transfer completed successfully.' 
        });
        // 🔄 NOTE: We no longer need setRefreshKey() here! 
        // The backend transaction will instantly update Firestore, 
        // and our onSnapshot listener above will drop the UI balance to 0 automatically.
      } else {
        setStatusModal({ 
          isOpen: true, 
          type: 'error', 
          message: result.message || 'Failed to process the transfer.' 
        });
      }
    } catch (error) {
      console.error("Transfer error:", error);
      const errorMsg = error.response?.data?.message || 'Network error. Could not connect to the server.';
      setStatusModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-dark"></span>
        </span>
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Syncing Live Vault Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Accountant Vault</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            Temporary holding area for unverified inflows. Review and transfer funds to the main CEO Vault.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-200/60">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-amber-600 tracking-wide uppercase">Live Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Balance Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-20">
            <p className="text-slate-400 text-xs font-semibold mb-2 tracking-widest uppercase">Pending Clearance</p>
            <h3 className="text-4xl lg:text-5xl font-semibold tracking-tighter text-slate-900 mb-8">
              <span className="text-2xl text-slate-300 font-light mr-2">AED</span>
              {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </h3>
            
            <button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={totalBalance <= 0 || isTransferring}
              className={`w-full py-4 rounded-xl font-medium tracking-wide transition-all duration-300 shadow-sm ${
                totalBalance > 0 && !isTransferring
                  ? 'bg-brand-dark text-white hover:bg-[#1E1A2F] hover:-translate-y-0.5 hover:shadow-md' 
                  : 'bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200/50'
              }`}
            >
              {isTransferring ? 'Processing Transfer...' : 'Authorize Transfer to CEO Vault'}
            </button>
          </div>

          {/* Rules Card */}
          <div className="bg-brand-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg">
             <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <h4 className="text-sm font-semibold text-white/90 mb-6 tracking-wide">Maker / Checker Protocol</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 text-white/60">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 shrink-0 text-xs font-bold text-white">1</span>
                <span className="leading-relaxed font-light">All new cash entered via Mass Inflow arrives here in the Accountant Vault first.</span>
              </li>
              <li className="flex gap-3 text-white/60">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 shrink-0 text-xs font-bold text-white">2</span>
                <span className="leading-relaxed font-light">Verify the physical notes match the distribution shown on the right.</span>
              </li>
              <li className="flex gap-3 text-white/60">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-light shrink-0 text-xs font-bold text-brand-dark">3</span>
                <span className="leading-relaxed font-light">Click Authorize to formally move the cash into the main CEO Vault inventory.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Denomination Distribution */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Pending Notes Overview</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              Quarantined Inventory
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            <div className="col-span-4 sm:col-span-3 pl-2">Note/Coin</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-4 sm:col-span-3 text-right">Total Value</div>
            <div className="col-span-4 text-right pr-2 hidden sm:block">Share</div>
          </div>

          {/* List */}
          <div className="flex-1 space-y-6 mt-2">
            {vaultData.map((item, idx) => {
              const percentage = totalBalance > 0 ? (item.totalValue / totalBalance) * 100 : 0;

              return (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
                    <div className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold ${item.type === 'note' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200 rounded-full w-7 h-7'}`}>
                      {item.type === 'note' ? '💵' : '🪙'}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                  
                  <div className="col-span-2 flex justify-center">
                    <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-medium px-4 py-1.5 rounded-xl">
                      {item.qty === 0 ? '-' : item.qty.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3 text-right font-semibold text-slate-900 text-sm">
                    {item.totalValue === 0 ? '-' : item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </div>
                  
                  <div className="col-span-4 hidden sm:flex items-center justify-end pl-6">
                    <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${percentage > 0 ? 'bg-amber-400' : 'bg-slate-200'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-400 font-light">Total pending transfer</span>
            <span className="font-semibold text-slate-900">AED {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>

      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowConfirmDialog(false)}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Authorize Transfer</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              You are about to move <strong className="text-slate-800">AED {totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> into the main CEO Vault. Have you physically verified these notes?
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTransfer}
                className="flex-1 py-3.5 bg-brand-dark text-white rounded-xl font-semibold hover:bg-[#1E1A2F] shadow-md transition-all hover:shadow-lg"
              >
                Yes, Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS / ERROR MODAL */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setStatusModal({ ...statusModal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-xl animate-in zoom-in-95 duration-300 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${statusModal.type === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100/50' : 'bg-rose-50 text-rose-500 border border-rose-100/50'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={statusModal.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
              {statusModal.type === 'success' ? 'Transfer Complete' : 'Transfer Failed'}
            </h3>
            <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">
              {statusModal.message}
            </p>
            <button 
              onClick={() => { setStatusModal({ ...statusModal, isOpen: false }); if (statusModal.type === 'success') navigate('/vault'); }}
              className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md"
            >
              Go to CEO Vault
            </button>
          </div>
        </div>
      )}

    </div>
  );
}