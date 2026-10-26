// frontend/src/pages/logs/LogsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import DailySummaryCards from '../../components/logs/DailySummaryCards';
import ExportLedgerModal from '../../components/logs/ExportLedgerModal';

// The categorized table cards
import InflowLogsCard from '../../components/logs/cards/InflowLogsCard';
import ExpenseLogsCard from '../../components/logs/cards/ExpenseLogsCard';
import TransferLogsCard from '../../components/logs/cards/TransferLogsCard';
import PettyCashLogsCard from '../../components/logs/cards/PettyCashLogsCard';
import DailyDenominationsCard from '../../components/logs/cards/DailyDenominationsCard';
import CeoVaultDailyDenominationsCard from '../../components/logs/cards/CeoVaultDailyDenominationsCard';

import api from '../../config/api'; 

export default function LogsPage() {
  // Main Ledger State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Dedicated Category & Search State for Expanded Card
  const [expandedLogs, setExpandedLogs] = useState([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedLoadingMore, setExpandedLoadingMore] = useState(false);
  const [expandedNextCursor, setExpandedNextCursor] = useState(null);
  const [expandedHasMore, setExpandedHasMore] = useState(false);
  const [expandedSearchQuery, setExpandedSearchQuery] = useState('');

  const [branchError, setBranchError] = useState(false); 
  const navigate = useNavigate();
  
  // State for the Calendar Filter (Updated to array)
  const [selectedDates, setSelectedDates] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // State for CEO Vault Pre-Aggregated Summary
  const [ceoVaultSummary, setCeoVaultSummary] = useState(null);
  
  // State for Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // State: Tracks which card is currently maximized (full-screen)
  const [expandedCard, setExpandedCard] = useState(null); 

  // Sort logs helper
  const sortLogsList = (list) => {
    return [...list].sort((a, b) => {
      const timeA = parseInt(String(a.id).split('-')[1]) || 0;
      const timeB = parseInt(String(b.id).split('-')[1]) || 0;
      
      if (timeA > 0 && timeB > 0) {
        return timeB - timeA; 
      }
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      return dateB - dateA; 
    });
  };

  // Map expanded card name to Firestore transaction type
  const getCategoryType = (cardName) => {
    switch (cardName) {
      case 'inflows': return 'INFLOW';
      case 'expenses': return 'OUTFLOW';
      case 'transfers': return 'TRANSFER';
      case 'pettyCash': return 'PETTY_CASH';
      default: return null;
    }
  };

  // Fetch category-isolated logs for the expanded card with optional search and cursor pagination
  const fetchExpandedLogs = useCallback(async (cardName, query = '', cursor = null, append = false) => {
    const activeBranch = localStorage.getItem('active_branch');
    if (!activeBranch || !cardName) return;

    const catType = getCategoryType(cardName);
    if (!catType) return;

    if (append) {
      setExpandedLoadingMore(true);
    } else {
      setExpandedLoading(true);
      if (!cursor) setExpandedNextCursor(null);
    }

    try {
      let endpoint = `/api/logs/all?branchId=${encodeURIComponent(activeBranch)}&type=${encodeURIComponent(catType)}&limit=30`;
      if (query && query.trim().length >= 2) {
        endpoint += `&search=${encodeURIComponent(query.trim())}`;
      }
      if (cursor) {
        endpoint += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const res = await api.get(endpoint);
      if (res.data.success) {
        const rows = sortLogsList(res.data.data || []);
        if (append) {
          setExpandedLogs(prev => {
            const combined = [...prev, ...rows];
            const seen = new Set();
            return sortLogsList(combined.filter(item => {
              if (!item.id || seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            }));
          });
        } else {
          setExpandedLogs(rows);
        }
        setExpandedNextCursor(res.data.nextCursor || null);
        setExpandedHasMore(!!res.data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching expanded category logs:', err);
    } finally {
      setExpandedLoading(false);
      setExpandedLoadingMore(false);
    }
  }, []);

  // Initial / Refresh fetch
  const fetchLogs = async (datesToFetch = selectedDates) => {
    setLoading(true);
    setNextCursor(null);
    setHasMore(false);

    try {
      const activeBranch = localStorage.getItem('active_branch');
      
      if (!activeBranch) {
        setBranchError(true);
        setLoading(false);
        return;
      }
      
      let mainEndpoint = `/api/logs/all?branchId=${encodeURIComponent(activeBranch)}&limit=30`;

      if (datesToFetch && datesToFetch.length > 0) {
        mainEndpoint = `/api/logs/daily?branchId=${encodeURIComponent(activeBranch)}&dates=${datesToFetch.join(',')}`;
      }
      
      const mainResponse = await api.get(mainEndpoint);
      
      if (mainResponse.data.success) {
        const sortedLogs = sortLogsList(mainResponse.data.data || []);
        setLogs(sortedLogs);
        setNextCursor(mainResponse.data.nextCursor || null);
        setHasMore(!!mainResponse.data.hasMore);

        if (mainResponse.data.ceoVaultSummary) {
          setCeoVaultSummary(mainResponse.data.ceoVaultSummary);
        } else {
          setCeoVaultSummary(null);
        }

        // Also refresh expanded card if open
        if (expandedCard && (!datesToFetch || datesToFetch.length === 0)) {
          fetchExpandedLogs(expandedCard, expandedSearchQuery);
        }
      }

    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cursor-based Load More function for infinite scroll (Overview Grid)
  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !nextCursor || (selectedDates && selectedDates.length > 0)) {
      return;
    }

    setLoadingMore(true);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;

      const endpoint = `/api/logs/all?branchId=${encodeURIComponent(activeBranch)}&limit=30&cursor=${encodeURIComponent(nextCursor)}`;
      const response = await api.get(endpoint);

      if (response.data.success) {
        const newRows = response.data.data || [];
        setLogs(prev => {
          const combined = [...prev, ...newRows];
          const seen = new Set();
          return sortLogsList(combined.filter(item => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }));
        });
        setNextCursor(response.data.nextCursor || null);
        setHasMore(!!response.data.hasMore);
      }
    } catch (error) {
      console.error("Error loading more logs:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, nextCursor, selectedDates]);

  // Handle server-side search when a card is expanded
  const handleExpandedSearch = useCallback((query) => {
    setExpandedSearchQuery(query);
    if (!selectedDates || selectedDates.length === 0) {
      fetchExpandedLogs(expandedCard, query);
    }
  }, [expandedCard, selectedDates, fetchExpandedLogs]);

  // Handle load more for the expanded card
  const handleExpandedLoadMore = useCallback(() => {
    if (expandedLoading || expandedLoadingMore || !expandedHasMore || !expandedNextCursor) {
      return;
    }
    fetchExpandedLogs(expandedCard, expandedSearchQuery, expandedNextCursor, true);
  }, [expandedLoading, expandedLoadingMore, expandedHasMore, expandedNextCursor, expandedCard, expandedSearchQuery, fetchExpandedLogs]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = (dates) => {
    setSelectedDates(dates);
    fetchLogs(dates);
  };

  const handleExpandToggle = (cardName) => {
    if (expandedCard === cardName) {
      setExpandedCard(null); 
      setExpandedLogs([]);
      setExpandedSearchQuery('');
      setExpandedNextCursor(null);
      setExpandedHasMore(false);
    } else {
      setExpandedCard(cardName); 
      setExpandedSearchQuery('');
      if (!selectedDates || selectedDates.length === 0) {
        fetchExpandedLogs(cardName, '');
      }
    }
  };

  // --- Data Filtering Logic (Strict Category Isolation) ---
  const isPettyOrReserve = (t) => {
    if (!t) return false;
    const type = t.type || '';
    if (['PETTY_CASH', 'RESERVE_ADD', 'RESERVE_TAKE', 'RESERVE_REVERSAL'].includes(type)) return true;
    const id = String(t.id || '');
    if (id.startsWith('PC-') || id.startsWith('RES-')) return true;
    const desc = String(t.description || '');
    if (desc.includes('Petty Cash') || desc.includes('Reserve Vault')) return true;
    if (t.allocationId) return true;
    return false;
  };

  const inflows = logs.filter(t => !isPettyOrReserve(t) && (t.type === 'INFLOW' || t.type === 'TEMP_INFLOW'));
  const expenses = logs.filter(t => t.type === 'OUTFLOW' || t.type === 'EXPENSE');
  const transfers = logs.filter(t => !isPettyOrReserve(t) && (t.type === 'TRANSFER' || t.type === 'EXCHANGE'));
  const pettyCash = logs.filter(t => isPettyOrReserve(t));

  // Branch Error UI Block
  if (branchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center max-w-md shadow-sm">
          <svg className="w-12 h-12 text-rose-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">Active Branch Missing</h3>
          <p className="text-slate-500 text-sm font-light mb-6">We could not identify your active branch location. Please log in or select a branch to view the master ledger.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-brand-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-40">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Master Ledger Logs</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            A complete, chronological audit trail of all vault inflows, expenses, and automated sweeps.
          </p>
        </div>
        
        {/* Filter, Export & Refresh Actions */}
        {!expandedCard && (
          <div className="flex items-center gap-3">
            
            {/* FILTER DATE BLOCK */}
            <div className="relative">
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                  selectedDates.length > 0 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md hover:bg-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:text-brand-dark hover:border-brand-light/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDates.length > 0 
                  ? (selectedDates.length === 1 
                      ? new Date(selectedDates[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                      : `${selectedDates.length} Dates Selected`) 
                  : 'Filter Date'}
              </button>

              <PremiumCalendar 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)} 
                selectedDates={selectedDates}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* EXPORT LEDGER BLOCK */}
            <div className="relative">
              <button 
                onClick={() => setIsExportModalOpen(!isExportModalOpen)}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl border border-rose-200/50 text-sm font-medium hover:bg-rose-600 hover:text-white transition-all shadow-sm group"
                title="Export Daily Audit PDF Report"
              >
                <svg className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export PDF Report
              </button>

              <ExportLedgerModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
              />
            </div>

            {/* REFRESH BUTTON */}
            <button 
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:text-brand-dark hover:border-brand-light/30 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Conditional Rendering of Daily Summary Cards */}
      {selectedDates.length > 0 && !loading && !expandedCard && (
        <DailySummaryCards 
          logs={logs} 
          ceoVaultSummary={ceoVaultSummary}
          selectedDates={selectedDates}
        />
      )}

      {/* RESTRUCTURED DASHBOARD GRID VIEW */}
      <div className={`transition-all duration-500 ${expandedCard ? 'block' : 'grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 xl:gap-6'}`}>
        
        {/* LEFT COLUMN: The Table Cards */}
        <div className={`${expandedCard ? 'block' : 'lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5 xl:gap-6'}`}>
          
          {/* Back Button (Only shows when a card is expanded) */}
          {expandedCard && (
            <div className="mb-4 animate-in fade-in slide-in-from-left-4">
              <button 
                onClick={() => setExpandedCard(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard View
              </button>
            </div>
          )}

          {(!expandedCard || expandedCard === 'inflows') && (
            <InflowLogsCard 
              inflowsData={expandedCard === 'inflows' && (!selectedDates || selectedDates.length === 0) ? expandedLogs : inflows} 
              loading={expandedCard === 'inflows' ? expandedLoading : loading} 
              loadingMore={expandedCard === 'inflows' ? expandedLoadingMore : loadingMore}
              hasMore={expandedCard === 'inflows' ? expandedHasMore : hasMore}
              onLoadMore={expandedCard === 'inflows' ? handleExpandedLoadMore : handleLoadMore}
              onSearch={expandedCard === 'inflows' ? handleExpandedSearch : null}
              isExpanded={expandedCard === 'inflows'}
              onExpand={() => handleExpandToggle('inflows')} 
              onRefresh={fetchLogs} 
            />
          )}

          {(!expandedCard || expandedCard === 'expenses') && (
            <ExpenseLogsCard 
              expensesData={expandedCard === 'expenses' && (!selectedDates || selectedDates.length === 0) ? expandedLogs : expenses} 
              loading={expandedCard === 'expenses' ? expandedLoading : loading} 
              loadingMore={expandedCard === 'expenses' ? expandedLoadingMore : loadingMore}
              hasMore={expandedCard === 'expenses' ? expandedHasMore : hasMore}
              onLoadMore={expandedCard === 'expenses' ? handleExpandedLoadMore : handleLoadMore}
              onSearch={expandedCard === 'expenses' ? handleExpandedSearch : null}
              isExpanded={expandedCard === 'expenses'}
              onExpand={() => handleExpandToggle('expenses')} 
              onRefresh={fetchLogs} 
            />
          )}

          {(!expandedCard || expandedCard === 'transfers') && (
            <TransferLogsCard 
              transfersData={expandedCard === 'transfers' && (!selectedDates || selectedDates.length === 0) ? expandedLogs : transfers} 
              loading={expandedCard === 'transfers' ? expandedLoading : loading} 
              loadingMore={expandedCard === 'transfers' ? expandedLoadingMore : loadingMore}
              hasMore={expandedCard === 'transfers' ? expandedHasMore : hasMore}
              onLoadMore={expandedCard === 'transfers' ? handleExpandedLoadMore : handleLoadMore}
              onSearch={expandedCard === 'transfers' ? handleExpandedSearch : null}
              isExpanded={expandedCard === 'transfers'}
              onExpand={() => handleExpandToggle('transfers')} 
            />
          )}

          {(!expandedCard || expandedCard === 'pettyCash') && (
            <PettyCashLogsCard 
              pettyCashData={expandedCard === 'pettyCash' && (!selectedDates || selectedDates.length === 0) ? expandedLogs : pettyCash} 
              loading={expandedCard === 'pettyCash' ? expandedLoading : loading} 
              loadingMore={expandedCard === 'pettyCash' ? expandedLoadingMore : loadingMore}
              hasMore={expandedCard === 'pettyCash' ? expandedHasMore : hasMore}
              onLoadMore={expandedCard === 'pettyCash' ? handleExpandedLoadMore : handleLoadMore}
              onSearch={expandedCard === 'pettyCash' ? handleExpandedSearch : null}
              isExpanded={expandedCard === 'pettyCash'}
              onExpand={() => handleExpandToggle('pettyCash')} 
            />
          )}

        </div>

        {/* RIGHT COLUMN: Daily Denominations Breakdown Sidebar */}
        {!expandedCard && (
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-5 xl:gap-6">
            <DailyDenominationsCard selectedDates={selectedDates} />
            <CeoVaultDailyDenominationsCard 
              ceoVaultSummary={ceoVaultSummary} 
              selectedDates={selectedDates} 
              loading={loading} 
            />
          </div>
        )}

      </div>
    </div>
  );
}