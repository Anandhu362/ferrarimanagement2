// frontend/src/pages/orders/OrderForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import api, { ENDPOINTS } from '../../config/api'; 
import OrderReviewQueue from '../../components/orders/OrderReviewQueue'; 
import RecentOrders from '../../components/orders/RecentOrders'; 
import ClientDetailsForm from '../../components/orders/ClientDetailsForm'; 

// ✅ UPGRADED PREMIUM FINTECH DROPDOWN (Now with Search!)
const FintechSelect = ({ name, value, options, onChange, placeholder, onKeyDown, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Focus the search input automatically when the dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      // Clear search term when closed
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter options based on the search term
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className={`relative w-full outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} 
      tabIndex={disabled ? "-1" : "0"} 
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter') {
          if (!isOpen && !value) setIsOpen(true);
          else if (onKeyDown && !isOpen) onKeyDown(e); // Only trigger next form field if closed
        }
      }}
    >
      {/* Backdrop to close when clicking outside */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>}
      
      {/* Trigger Area */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 font-medium flex justify-between items-center shadow-sm transition-all focus-within:border-brand-light focus-within:ring-4 focus-within:ring-brand-light/10 ${disabled ? 'bg-slate-100 hover:bg-slate-100' : 'cursor-pointer'}`}
      >
        <span className={value ? "text-slate-900 line-clamp-1 pr-2" : "text-slate-300"}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-brand-dark' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] rounded-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* 🔍 SEARCH INPUT AREA */}
          <div className="px-3 pb-2 pt-1 border-b border-slate-50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent clicking the input from closing the dropdown
                className="w-full pl-9 pr-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm text-sm"
              />
            </div>
          </div>

          {/* LIST OF OPTIONS */}
          <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full pt-1">
            {filteredOptions.length === 0 ? (
               <div className="px-5 py-4 text-sm text-slate-400 italic text-center">No matching options found</div>
            ) : (
               filteredOptions.map(opt => (
                 <div
                   key={opt}
                   onClick={(e) => {
                     e.stopPropagation();
                     onChange({ target: { name, value: opt } });
                     setIsOpen(false);
                   }}
                   className={`px-5 py-2.5 cursor-pointer text-sm font-medium transition-colors ${value === opt ? 'bg-brand-light/10 text-brand-dark' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                 >
                   {opt}
                 </div>
               ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrderForm() {
  const [companyDetails, setCompanyDetails] = useState({
    date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }),
    deliveryDate: '', 
    name: '',
    phone: '',
    location: ''
  });

  const [currentItem, setCurrentItem] = useState({
    product: '',
    weight: '',
    qty: ''
  });

  const [liveInventory, setLiveInventory] = useState([]);
  const [orderQueue, setOrderQueue] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const inputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
  const labelClasses = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block pl-1";

  // ✅ CACHED FETCH LOGIC IMPLEMENTED HERE
  useEffect(() => {
    let isMounted = true;

    const fetchLiveInventory = async (forceRefresh = false) => {
      try {
        const invEndpoint = ENDPOINTS?.INVENTORY || '/api/inventory';
        const response = await api.get(invEndpoint);
        
        if (isMounted && response.data) {
          setLiveInventory(response.data);
          // Update the cache with the fresh data
          sessionStorage.setItem('ferrari_inventory', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Failed to fetch live inventory:", error);
      }
    };

    // LOGIC: Use cache on initial load (refreshTrigger === 0), force API on subsequent updates
    if (refreshTrigger === 0) {
      const cachedInventory = sessionStorage.getItem('ferrari_inventory');
      if (cachedInventory) {
        setLiveInventory(JSON.parse(cachedInventory));
      } else {
        fetchLiveInventory(); // Cache empty, go to backend
      }
    } else {
      // refreshTrigger changed (an order was pushed), bypass cache and fetch fresh data
      fetchLiveInventory(true);
    }

    return () => { isMounted = false; };
  }, [refreshTrigger]); 

  const inStockInventory = liveInventory.map(item => {
    const qtyInQueue = orderQueue
      .filter(q => q.product === item.product_name && q.weight === item.weight)
      .reduce((sum, q) => sum + parseInt(q.qty, 10), 0);
      
    return {
      ...item,
      available_qty: Math.max(0, parseInt(item.qty, 10) - qtyInQueue)
    };
  }).filter(item => item.available_qty > 0); 

  const availableProducts = [...new Set(inStockInventory.map(item => item.product_name))].filter(Boolean);
  
  let availableWeights = [];
  if (currentItem.product) {
    availableWeights = [...new Set(
      inStockInventory
        .filter(item => item.product_name === currentItem.product)
        .map(item => item.weight)
    )].filter(Boolean);
  } else {
    availableWeights = [...new Set(inStockInventory.map(item => item.weight))].filter(Boolean);
  }

  // --- HANDLERS ---
  const handleCompanyChange = (e) => {
    setCompanyDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'product') {
      const validWeightsForNewProduct = inStockInventory
        .filter(i => i.product_name === value)
        .map(i => i.weight);
        
      if (currentItem.weight && !validWeightsForNewProduct.includes(currentItem.weight)) {
         setCurrentItem({ ...currentItem, product: value, weight: '', qty: '' });
         return;
      }
      setCurrentItem({ ...currentItem, product: value, qty: '' }); 
      return;
    }

    if (name === 'weight') {
       setCurrentItem({ ...currentItem, weight: value, qty: '' });
       return;
    }

    if (name === 'qty') {
      if (value === '') {
        setCurrentItem({ ...currentItem, qty: '' });
        return;
      }

      let numericVal = parseInt(value, 10);
      
      if (!isNaN(numericVal) && currentItem.product && currentItem.weight) {
        const dbItem = inStockInventory.find(
          i => i.product_name === currentItem.product && i.weight === currentItem.weight
        );
        
        if (dbItem && numericVal > dbItem.available_qty) {
          numericVal = dbItem.available_qty;
        }
      }
      
      setCurrentItem({ ...currentItem, qty: isNaN(numericVal) ? '' : numericVal });
      return;
    }
    
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (e.target.name === 'qty') {
        handleAddItem(); 
        return;
      }

      const container = e.target.closest('.pos-form-container');
      if (container) {
        const focusables = Array.from(container.querySelectorAll('input:not([disabled]), [tabindex="0"]'));
        const currentIndex = focusables.indexOf(e.currentTarget);
        
        if (currentIndex > -1 && currentIndex < focusables.length - 1) {
          focusables[currentIndex + 1].focus();
        }
      }
    }
  };

  const handleAddItem = () => {
    if (!companyDetails.name || !companyDetails.location || !companyDetails.phone || !companyDetails.deliveryDate) {
      setModal({ isOpen: true, type: 'error', message: 'Please fill out all Client Details, including the Delivery Date, first.' });
      return;
    }
    
    const requestedQty = parseInt(currentItem.qty, 10);
    if (!currentItem.product || !currentItem.weight || !requestedQty || requestedQty <= 0) {
      setModal({ isOpen: true, type: 'error', message: 'Please select a product, weight, and a valid quantity.' });
      return;
    }

    const dbItem = inStockInventory.find(
      i => i.product_name === currentItem.product && i.weight === currentItem.weight
    );

    if (!dbItem || !dbItem.inv_id) {
      setModal({ isOpen: true, type: 'error', message: 'Could not resolve the unique ID for this product. Please refresh the page.' });
      return;
    }

    setOrderQueue([...orderQueue, { 
      id: Date.now(),
      inventory_id: dbItem.inv_id, 
      companyName: companyDetails.name,
      phone: companyDetails.phone,
      location: companyDetails.location,
      date: companyDetails.date,
      deliveryDate: companyDetails.deliveryDate, 
      ...currentItem 
    }]);
    
    setCurrentItem({ product: '', weight: '', qty: '' });
  };

  const handleRemoveItem = (id) => {
    setOrderQueue(orderQueue.filter(item => item.id !== id));
  };

  const handleConfirmOrders = async () => {
    if (orderQueue.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const activeBranch = localStorage.getItem('active_branch') || 'DXB-MAIN';
      
      const cleanOrders = orderQueue.map(order => ({
        inventory_id: order.inventory_id,
        companyName: order.companyName,
        phone: order.phone,
        location: order.location,
        date: order.date,
        deliveryDate: order.deliveryDate,
        product: order.product,
        weight: order.weight,
        qty: parseInt(order.qty, 10)
      }));

      const payload = { branchId: activeBranch, orders: cleanOrders };
      
      const bulkEndpoint = ENDPOINTS?.ORDERS?.BULK || ENDPOINTS?.ORDERS_BULK || '/api/orders/bulk';

      const response = await api.post(bulkEndpoint, payload);

      if (response.data.success) {
        setModal({ isOpen: true, type: 'success', message: `Successfully pushed ${orderQueue.length} bulk orders and updated master inventory.` });
        
        setCompanyDetails({ 
          date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }), 
          deliveryDate: '', 
          name: '', 
          phone: '', 
          location: '' 
        });
        setOrderQueue([]);
        
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Connection error: Failed to reach the server. Ensure backend is running.';
      setModal({ isOpen: true, type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12 pos-form-container">
      
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Order POS</h2>
        <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">Rapid sales order entry and bulk queue management.</p>
      </div>

      <div className="space-y-6 flex flex-col">
        
        <ClientDetailsForm 
          companyDetails={companyDetails}
          onChange={handleCompanyChange}
          onKeyDown={handleKeyDown}
        />

        <div className="bg-white rounded-[2rem] border border-brand-light/20 shadow-[0_8px_30px_rgba(var(--brand-light-rgb),0.05)] relative z-20">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-light/5 rounded-full blur-3xl"></div>
          </div>

          <div className="p-8 relative z-10">
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">2. Add Product</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
              <div className="md:col-span-5">
                <label className={labelClasses}>Select Product</label>
                <FintechSelect 
                  name="product"
                  value={currentItem.product}
                  placeholder={liveInventory.length === 0 ? "Loading products..." : "-- Choose a product --"}
                  options={availableProducts}
                  onChange={handleItemChange}
                  onKeyDown={handleKeyDown}
                  disabled={availableProducts.length === 0}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelClasses}>Weight (KG)</label>
                <FintechSelect 
                  name="weight"
                  value={currentItem.weight}
                  placeholder="-- Size --"
                  options={availableWeights}
                  onChange={handleItemChange}
                  onKeyDown={handleKeyDown}
                  disabled={availableWeights.length === 0}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClasses}>QTY</label>
                <input 
                  type="number" 
                  name="qty" 
                  min="1"
                  placeholder="0" 
                  value={currentItem.qty} 
                  onChange={handleItemChange} 
                  onKeyDown={handleKeyDown}
                  className={`${inputClasses} text-center font-bold text-brand-dark`} 
                />
              </div>

              <div className="md:col-span-2">
                <button 
                  onClick={handleAddItem}
                  className="w-full h-[50px] bg-slate-900 text-white rounded-xl font-semibold hover:bg-brand-dark transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  Add to Batch
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <OrderReviewQueue 
            queue={orderQueue} 
            onRemove={handleRemoveItem} 
            onSubmit={handleConfirmOrders} 
            isSubmitting={isSubmitting} 
          />
        </div>

        <RecentOrders refreshTrigger={refreshTrigger} />

      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.08)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {modal.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">{modal.type === 'success' ? 'Orders Queued' : 'Error'}</h3>
              <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">{modal.message}</p>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">Okay, got it</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}