import React, { useState, useEffect, useRef, useMemo } from 'react';
import EditInflowDateModal from '../../inflow/EditInflowDateModal';

export default function InflowLogsCard({ inflowsData, loading, isExpanded, onExpand }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInflow, setSelectedInflow] = useState(null);
  
  // Track if navigation is currently via keyboard to prevent hover jumping
  const isKeyboardNav = useRef(false); 

  // --- NEW: Helper to extract invoice from description ---
  const extractInvoiceNumber = (trx) => {
    // 1. Check if backend eventually adds it as a standalone field
    if (trx.invoiceNumber) return trx.invoiceNumber;
    if (trx.invoice_number) return trx.invoice_number;

    // 2. Extract from description (e.g., "Invoice INV777 - SAM LLC")
    if (trx.description && trx.description.includes('Invoice ')) {
      const parts = trx.description.split(' - ');
      if (parts.length > 0 && parts[0].includes('Invoice ')) {
        return parts[0].replace('Invoice ', '').trim(); // Returns just "INV777"
      }
    }

    return '-';
  };

  // Filter data dynamically based on search query
  const filteredData = useMemo(() => {
    if (!inflowsData) return [];
    if (!searchQuery.trim()) return inflowsData;

    const lowerQuery = searchQuery.toLowerCase();
    return inflowsData.filter(trx => {
      // Check description (Company Name)
      const descMatch = (trx.description || '').toLowerCase().includes(lowerQuery);
      // Check amount
      const amountMatch = String(trx.amount || '').includes(lowerQuery);
      // Check invoice using the new extractor
      const invoiceMatch = extractInvoiceNumber(trx).toLowerCase().includes(lowerQuery);
      // Check agent name
      const agentMatch = (trx.agentName || '').toLowerCase().includes(lowerQuery);
      
      return descMatch || amountMatch || invoiceMatch || agentMatch;
    });
  }, [inflowsData, searchQuery]);

  // Clear search query when the card is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setSearchQuery('');
    }
  }, [isExpanded]);

  // Reset selection when filtered data changes or modal state changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredData, isExpanded]);

  // Auto-scroll to keep the selected row in view
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const rows = containerRef.current.querySelectorAll('tbody tr');
      if (rows[selectedIndex]) {
        rows[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!filteredData || filteredData.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault(); 
      isKeyboardNav.current = true; 
      setSelectedIndex((prev) => Math.min(prev + 1, filteredData.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      isKeyboardNav.current = true; 
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  // Re-enable mouse selection ONLY if the physical mouse moves
  const handleMouseMove = (e) => {
    if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
      isKeyboardNav.current = false;
    }
  };
  
  // --- Helper Functions ---
  const formatTrxDate = (dateVal) => {
    if (!dateVal) return '--:--';
    try {
      let dateStr = typeof dateVal === 'object' && dateVal.value ? dateVal.value : String(dateVal);
      dateStr = dateStr.replace(' ', 'T');
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' - ' + 
             dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTrxColors = (type) => {
    if (type === 'TEMP_INFLOW') return { dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]', text: 'text-purple-600', prefix: '+ ' };
    return { dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]', text: 'text-emerald-600', prefix: '+ ' };
  };

  const getStatusBadge = (status) => {
    if (status === 'SYSTEM') return 'bg-blue-50 text-blue-500 border-blue-200/50';
    if (status === 'PENDING CEO') return 'bg-purple-50 text-purple-600 border-purple-200/50';
    if (status === 'VERIFIED') return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
    return 'bg-slate-50 text-slate-500 border-slate-200/50';
  };

  // --- UPDATED: Ensure Company Name is clean of Invoice Data ---
  const extractCompanyName = (desc) => {
    if (!desc) return '';
    // If formatted like "Invoice INV777 - SAM LLC", return everything after the first dash
    if (desc.includes('Invoice ') && desc.includes(' - ')) {
      const parts = desc.split(' - ');
      return parts.slice(1).join(' - ').trim();
    }
    // Fallback for older entries
    const parts = desc.split(' - ');
    if (parts.length > 1) {
      return parts.slice(1).join(' - ').trim();
    }
    return desc;
  };

  const handleEditClick = (e, trx) => {
    e.stopPropagation();
    // Map the properties correctly for the modal
    setSelectedInflow({
      ...trx,
      companyName: extractCompanyName(trx.description),
      invoiceNumber: extractInvoiceNumber(trx)
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col transition-all ${
      isExpanded ? 'h-[75vh]' : 'min-h-[500px] h-[55vh]'
    }`}>
      
      {/* Emerald Banner Header */}
      <div className="bg-emerald-500 px-8 py-5 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute -right-4 -top-12 w-32 h-32 bg-emerald-400 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide uppercase">Inflows</h3>
            <p className="text-emerald-100 text-xs font-medium">All revenue and incoming cash</p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          
          {isExpanded && (
            <div className="relative animate-in fade-in zoom-in-95 duration-200">
              <input
                type="text"
                placeholder="Search name, invoice, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/20 text-white placeholder:text-white/70 border border-white/20 rounded-full pl-4 pr-9 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-white/50 w-48 sm:w-64 transition-all backdrop-blur-sm"
              />
              <svg className="w-3.5 h-3.5 text-white/80 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          <div className="bg-white/20 px-3 sm:px-4 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
            <span className="text-white text-[10px] sm:text-xs font-bold">{filteredData.length} Records</span>
          </div>
          
          <button onClick={onExpand} className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white shrink-0">
            {isExpanded ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 9V5m0 4H5m4 0l-5-5m11 5V5m0 4h4m-4 0l5-5M9 15v4m0-4H5m4 0l5 5m11-5v4m0-4h4m-4 0l5 5" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-4v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l-5-5m11 5v-4m0 4h-4m4 0l-5 5" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Table Content */}
      <div 
        ref={containerRef}
        tabIndex={0} 
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        className="overflow-auto grow focus:outline-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full relative"
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500"></span>
            </span>
            <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading inflows...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 shadow-sm">
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Date & Time</th>
                <th className="px-6 py-4 w-full bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Company</th>
                {/* NEW INVOICE HEADER */}
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Invoice</th>
                <th className="px-6 py-4 text-right whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Amount (AED)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80">Status</th>
                {/* ACTIONS HEADER */}
                <th className="px-6 py-4 whitespace-nowrap bg-slate-50/95 backdrop-blur-md border-b border-slate-100/80"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-sm">
              {!filteredData || filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>{searchQuery ? 'No matching records found.' : 'No inflow records found for this period.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((trx, index) => {
                  const billedVal = parseFloat(trx.billedAmount || trx.billed_amount || 0);
                  const { dot, text, prefix } = getTrxColors(trx.type);
                  const isSelected = index === selectedIndex;
                  
                  // UPDATED: Grab invoice string using the new helper
                  const invoiceStr = extractInvoiceNumber(trx);
                  
                  return (
                    <tr 
                      key={index} 
                      onMouseEnter={() => {
                        if (!isKeyboardNav.current) {
                          setSelectedIndex(index);
                        }
                      }}
                      className={`transition-colors group cursor-pointer ${
                        isSelected ? 'bg-emerald-100/60' : 'hover:bg-emerald-50/30'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-light text-xs group-hover:text-slate-700 transition-colors">{formatTrxDate(trx.createdAt || trx.created_at)}</td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`}></span>
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors line-clamp-1">
                              {extractCompanyName(trx.description)}
                            </span>
                            
                            {billedVal > 0 && (
                              <span className="text-[10px] text-slate-500 mt-0.5 tracking-wide group-hover:text-slate-700 transition-colors">
                                Bill: AED {billedVal.toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </span>
                            )}

                            {/* ✅ NEW: Agent Tracing Subtitle Logic */}
                            {(() => {
                              // 1. Handle Multi-Agent Group Entries
                              if (trx.sourceAgents && Array.isArray(trx.sourceAgents) && trx.sourceAgents.length > 1) {
                                const agentText = trx.sourceAgents.join(', ');
                                return (
                                  <span 
                                    className="text-[10px] text-purple-500/90 font-semibold mt-0.5 tracking-wide flex items-center gap-1 group-hover:text-purple-600 transition-colors cursor-help" 
                                    title={`Agents: ${agentText}`} // Tooltip shows all names on hover
                                  >
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Group Entry ({trx.sourceAgents.length} Agents)
                                  </span>
                                );
                              }
                              
                              // 2. Handle Single Agent Entries (Fallback to array[0] or legacy agentName string)
                              const singleAgentName = (trx.sourceAgents && trx.sourceAgents[0]) || trx.agentName;
                              
                              if (singleAgentName && singleAgentName !== 'Desk Entry') {
                                return (
                                  <span className="text-[10px] text-blue-500/80 font-medium mt-0.5 tracking-wide flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Entry by {singleAgentName}
                                  </span>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* NEW INVOICE DATA CELL */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-600 font-medium text-xs tracking-wide group-hover:text-slate-800 transition-colors">
                          {invoiceStr}
                        </span>
                      </td>

                      <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap tracking-tight ${text}`}>
                        {prefix}{parseFloat(trx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-semibold tracking-wide uppercase border ${getStatusBadge(trx.status || 'COMPLETED')}`}>
                          {trx.status || 'COMPLETED'}
                        </span>
                      </td>

                      {/* EDIT ACTION BUTTON */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => handleEditClick(e, trx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Date"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Inflow Date Modal */}
      <EditInflowDateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInflow(null);
        }}
        inflow={selectedInflow}
        onSuccess={() => {
          setIsEditModalOpen(false);
          // Assuming a full reload to fetch new data or trigger a parent update
          if (window) window.location.reload(); 
        }}
      />
    </div>
  );
}