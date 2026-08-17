import React, { useState, useEffect, useMemo } from 'react';
import api from '../../config/api'; //[cite: 7, 8]
import VendorTable from '../../components/procurement/VendorTable';
import VendorFormModal from '../../components/procurement/VendorFormModal';

export default function VendorsPage() {
  // Master State Management[cite: 8]
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search Filter State[cite: 8]
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form State[cite: 8]
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Alert Modal State[cite: 8]
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'success', message: '' });

  // 1. Fetch Data
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/vendors');
      setVendors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
      setAlertModal({ 
        isOpen: true, 
        type: 'error', 
        message: 'Failed to load vendor data from the database. Please check your connection.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // 2. Search Filter Logic[cite: 8]
  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendors;
    
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return vendors.filter(vendor => {
      return (
        (vendor.vendor_id?.toLowerCase() || '').includes(lowercasedTerm) ||
        (vendor.vendorName?.toLowerCase() || '').includes(lowercasedTerm) ||
        (vendor.payeeDetails?.toLowerCase() || '').includes(lowercasedTerm)
      );
    });
  }, [vendors, searchTerm]);

  // 3. Handlers[cite: 8]
  const handleOpenForm = (vendor = null) => {
    setEditingVendor(vendor); // If null, it acts as "Add New"[cite: 8]
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
  };

  const handleFormSuccess = () => {
    const successMessage = editingVendor ? 'Vendor details updated successfully.' : 'New vendor added to system.';
    handleCloseForm();
    fetchVendors(); // Refresh the table data
    setAlertModal({ isOpen: true, type: 'success', message: successMessage });
  };

  const handleDelete = async (vendor_id) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/api/vendors/${vendor_id}`);
      setAlertModal({ isOpen: true, type: 'success', message: 'Vendor removed successfully.' });
      fetchVendors();
    } catch (error) {
      console.error("Delete error:", error);
      setAlertModal({ isOpen: true, type: 'error', message: 'Failed to delete vendor.' });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative"> {/*[cite: 8] */}
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"> {/*[cite: 8] */}
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Vendor Management</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Manage procurement vendor accounts and payee details.</p>
        </div>
        <button 
          onClick={() => handleOpenForm(null)}
          className="px-8 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-[#1E1A2F] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex items-center gap-2" /*[cite: 8] */
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Add New Vendor
        </button>
      </div>

      {/* Main Grid Card */}
      <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-visible relative z-10"> {/*[cite: 8] */}
        
        {/* Search Bar Section */}
        <div className="p-6 md:px-8 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center relative z-[100] rounded-t-[2rem]"> {/*[cite: 8] */}
          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/*[cite: 8] */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by ID, Vendor Name, Payee Details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm" /*[cite: 8] */
            />
          </div>
          
          <div className="text-sm font-semibold text-slate-500">
            Showing <span className="text-slate-900">{filteredVendors.length}</span> vendors
          </div>
        </div>

        {/* Vendor Table Container */}
        <div className="relative bg-white min-h-[400px] z-10 rounded-b-[2rem]"> {/*[cite: 8] */}
          <VendorTable 
            data={filteredVendors} 
            isLoading={isLoading}
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
          />
          
          {/* Empty state specifically for when search yields no results[cite: 8] */}
          {!isLoading && filteredVendors.length === 0 && vendors.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 rounded-b-[2rem]">
               <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-600 tracking-tight">No vendors found</p>
              <p className="text-xs text-slate-400 mt-1 font-light">Adjust your search to find specific vendor accounts.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD / EDIT FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={handleCloseForm}></div> {/*[cite: 8] */}
          
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full relative z-50 shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 tracking-tight">
              {editingVendor ? 'Edit Vendor Details' : 'Add New Vendor'}
            </h3>
            
            <VendorFormModal 
              initialData={editingVendor} 
              onSuccess={handleFormSuccess} 
              onCancel={handleCloseForm} 
            />
          </div>
        </div>
      )}

      {/* --- SUCCESS / ERROR MODAL ---[cite: 8] */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              }`}>
                {alertModal.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
                {alertModal.type === 'success' ? 'Success' : 'Error'}
              </h3>
              
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">
                {alertModal.message}
              </p>
              
              <button 
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg"
              >
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}