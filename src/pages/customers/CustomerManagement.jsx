// frontend/src/pages/customers/CustomerManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../config/api';
import AddCustomerModal from '../../components/customers/AddCustomerModal';
import { fetchWithCache } from '../../utils/cacheUtils'; // ✅ Imported caching utility

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch logic extracted so the modal can trigger a refresh after adding
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ REPLACED direct api.get with fetchWithCache (60 min TTL)
      const response = await fetchWithCache('ferrari_customers_cache', '/api/customers', 60);
      
      if (response.data && response.data.success) {
        setCustomers(response.data.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError("Failed to load customer directory. Ensure backend endpoint is active.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on Mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter and Search Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      return (
        (customer.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.phoneNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.deliveryLocation?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    });
  }, [customers, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Helper to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-[110]">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Customer Directory</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Manage client profiles, contact details, and default delivery zones.</p>
        </div>
        
        {/* Quick Stats Badge & Add Button */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-3 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</span>
            <span className="text-xl font-bold text-slate-900">{customers.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          
          {/* Solid Indigo Add Button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
            title="Add New Customer"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
             <span className="text-sm font-bold tracking-wide">Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-visible relative z-10">
        
        {/* Search Bar Container */}
        <div className="p-6 md:px-8 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center relative z-[100] rounded-t-[2rem]">
          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search by ID, Name, Phone, Location..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Data Table Area */}
        <div className="relative bg-white min-h-[400px] z-10 rounded-b-[2rem]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20 rounded-b-[2rem]">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Loading directory...</p>
            </div>
          ) : error ? (
            <div className="py-20 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-700 font-semibold">{error}</p>
            </div>
          ) : currentCustomers.length === 0 ? (
            <div className="py-24 px-6 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 tracking-tight">No customers found</p>
              <p className="text-xs text-slate-400 mt-1 font-light">Add a new customer to start building your directory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 md:px-8 py-5">Customer ID</th>
                    <th className="px-6 py-5">Client Name</th>
                    <th className="px-6 py-5">Phone Number</th>
                    <th className="px-6 py-5">Delivery Location</th>
                    <th className="px-6 py-5 text-right">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {currentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      <td className="px-6 md:px-8 py-4">
                        <span className="font-bold text-slate-900 tracking-tight">{customer.id}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                             {customer.customerName.charAt(0).toUpperCase()}
                           </div>
                           <span className="font-semibold text-slate-800">{customer.customerName}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {customer.phoneNumber}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-md text-xs">
                          {customer.deliveryLocation}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-500 text-xs font-medium">{formatDate(customer.createdAt)}</span>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && filteredCustomers.length > 0 && (
          <div className="p-6 md:px-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 rounded-b-[2rem]">
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="text-slate-900">{filteredCustomers.length}</span> records
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

      {/* Mount the Add Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={fetchCustomers}
        />
      )}
      
    </div>
  );
}