// frontend/src/pages/orders/OrderHistory.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../../components/shared/PremiumCalendar'; 
import EditOrderModal from '../../components/orders/EditOrderModal'; 
import DeliveryExportModal from '../../components/orders/DeliveryExportModal';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Extracted fetch logic so the modal can trigger a refresh after an edit
  const fetchOrderHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/history');
      if (response.data) {
        const sortedOrders = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(sortedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch order history:", err);
      setError("Failed to load ledger data. Ensure backend endpoint is active.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Order History on Mount
  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // Filter and Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.product?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter ? order.date === dateFilter : true;

      return matchesSearch && matchesDate;
    });
  }, [orders, searchTerm, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // ✅ VISUAL BATCHING LOGIC: Group current page orders by Order ID
  const groupedCurrentOrders = useMemo(() => {
    const groupsMap = new Map();
    currentOrders.forEach(order => {
      if (!groupsMap.has(order.id)) {
        groupsMap.set(order.id, {
          id: order.id,
          date: order.date,
          companyName: order.companyName,
          phone: order.phone,
          location: order.location,
          deliveryDate: order.deliveryDate,
          items: []
        });
      }
      groupsMap.get(order.id).items.push(order);
    });
    return Array.from(groupsMap.values());
  }, [currentOrders]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handler to open the modal with the specific order data
  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status) => {
    const s = (status || 'CONFIRMED').toUpperCase();
    switch (s) {
      case 'CONFIRMED':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider">CONFIRMED</span>;
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider">PENDING</span>;
      case 'CANCELLED':
        return <span className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider">CANCELLED</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider">{s}</span>;
    }
  };

  // Helper to format date for display
  const displayDate = dateFilter 
    ? new Date(dateFilter).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Filter by date...';

  // Helper to format the delivery date specifically for the table view
  const formatDeliveryDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* ✅ Z-INDEX FIX: Added relative z-[110] to ensure this container stacks above the z-[100] filters */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-[110]">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Master Ledger</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Complete historical record of all verified and pushed orders.</p>
        </div>
        
        {/* Quick Stats Badge & Export Button */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Records</span>
            <span className="text-xl font-bold text-slate-900">{orders.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
            title="Export Delivery Schedule"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             <span className="text-sm font-bold tracking-wide">Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-visible relative z-10">
        
        {/* Filters & Search Bar */}
        <div className="p-6 md:px-8 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center relative z-[100] rounded-t-[2rem]">
          
          {/* Search Box */}
          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search by ID, Company, Product..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm"
            />
          </div>

          {/* Date Filter & Actions */}
          <div className="flex gap-3 w-full md:w-auto items-center shrink-0 relative">
             <div className="relative w-full md:w-[220px]">
                <button
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl font-medium outline-none transition-all shadow-sm text-sm flex justify-between items-center ${dateFilter ? 'text-slate-900 border-brand-light ring-4 ring-brand-light/10 bg-white' : 'text-slate-400'}`}
                >
                  <span>{displayDate}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                <PremiumCalendar
                  isOpen={isCalendarOpen}
                  onClose={() => setIsCalendarOpen(false)}
                  selectedDate={dateFilter}
                  onDateSelect={(newDate) => {
                    setDateFilter(newDate || ''); 
                    setCurrentPage(1);
                    if(newDate) setIsCalendarOpen(false); 
                  }}
                />
             </div>

            {dateFilter && (
              <button 
                onClick={() => { setDateFilter(''); setCurrentPage(1); }}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-colors shadow-sm whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table Area */}
        <div className="relative bg-white min-h-[400px] z-10 rounded-b-[2rem]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20 rounded-b-[2rem]">
              <svg className="animate-spin h-8 w-8 text-brand-light mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing ledger records...</p>
            </div>
          ) : error ? (
            <div className="py-20 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-700 font-semibold">{error}</p>
            </div>
          ) : currentOrders.length === 0 ? (
            <div className="py-24 px-6 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 tracking-tight">No records found</p>
              <p className="text-xs text-slate-400 mt-1 font-light">Adjust your search or date filters to find specific orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 md:px-8 py-5">Order ID / Date</th>
                    <th className="px-6 py-5">Client Details</th>
                    <th className="px-6 py-5">Delivery Info</th>
                    <th className="px-6 py-5">Product Specs</th>
                    <th className="px-6 py-5 text-center">Qty</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 md:px-8 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {/* ✅ Map through grouped orders first */}
                  {groupedCurrentOrders.map((group) => (
                    <React.Fragment key={group.id}>
                      {/* ✅ Map through individual items within the group */}
                      {group.items.map((order, index) => {
                        const isFirstInGroup = index === 0;

                        return (
                          <tr key={`${order.id}-${index}`} className="hover:bg-slate-50/50 transition-colors group/row">
                            
                            {/* Merged Columns: Only render on the FIRST item and span downward */}
                            {isFirstInGroup && (
                              <td rowSpan={group.items.length} className="px-6 md:px-8 py-4 align-top bg-white border-r border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 tracking-tight">{order.id || `ORD-${Math.floor(Math.random() * 900000) + 100000}`}</span>
                                  <span className="text-[11px] text-slate-500 mt-1">{order.date || '—'}</span>
                                </div>
                              </td>
                            )}

                            {isFirstInGroup && (
                              <td rowSpan={group.items.length} className="px-6 py-4 align-top bg-white border-r border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800">{order.companyName || '—'}</span>
                                  <span className="text-[11px] text-slate-500 mt-1">{order.phone || '—'}</span>
                                </div>
                              </td>
                            )}

                            {isFirstInGroup && (
                              <td rowSpan={group.items.length} className="px-6 py-4 align-top bg-white border-r border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-600 truncate max-w-[200px] block" title={order.location || '—'}>
                                    {order.location || '—'}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="font-medium">{formatDeliveryDate(order.deliveryDate)}</span>
                                  </div>
                                </div>
                              </td>
                            )}

                            {/* Standard Columns: Always render for every product */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-light shrink-0"></span>
                                  <span className="font-semibold text-slate-800">{order.product || '—'}</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 w-fit px-2 py-0.5 rounded ml-3.5 mt-1">
                                  {order.weight || '—'}
                                </span>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 text-center">
                              <span className="text-brand-dark font-bold text-lg">{order.qty ? Number(order.qty).toLocaleString() : 0}</span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(order.status)}
                            </td>

                            <td className="px-6 md:px-8 py-4 text-center">
                              <button 
                                onClick={() => handleEditClick(order)}
                                className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-slate-400 hover:bg-brand-light/10 hover:text-brand-dark transition-colors"
                                title="Edit Order"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
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
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="p-6 md:px-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 rounded-b-[2rem]">
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> records
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + idx;
                    if (pageNum > totalPages) return null;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                        currentPage === pageNum 
                          ? 'bg-slate-900 text-white border-transparent shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Mount the Existing Edit Modal */}
      <EditOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onRefresh={fetchOrderHistory}
      />

      {/* Mount the New Delivery Export Modal */}
      <DeliveryExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
    </div>
  );
}