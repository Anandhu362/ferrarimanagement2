// frontend/src/pages/orders/DeliveryFormGen.jsx
import React, { useState, useEffect, useRef } from 'react';
import api, { ENDPOINTS } from '../../config/api';
import PremiumCalendar from '../../components/shared/PremiumCalendar'; 
import { fetchWithCache } from '../../utils/cacheUtils'; 
import DeliverySetupModal from '../../components/orders/DeliverySetupModal';
import DeliveryHistoryTable from '../../components/orders/DeliveryHistoryTable';
import { generateDailyOrderPDF } from '../../utils/pdfGeneratorService';

export default function DeliveryFormGen() {
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  
  // Refs and states for the Add Column Dropdown
  const addColumnRef = useRef(null);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [availableExtraProducts, setAvailableExtraProducts] = useState([]);
  
  // Chunking State to prevent browser crashes
  const [visibleCount, setVisibleCount] = useState(50);

  // Keyboard Navigation & Focus Tracking States
  const [customerFocusedIndex, setCustomerFocusedIndex] = useState(-1);
  const [productFocusedIndex, setProductFocusedIndex] = useState(0);
  const [lastActiveRowId, setLastActiveRowId] = useState(null);
  const activeItemRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]); 
  const [activeDropdown, setActiveDropdown] = useState(null); 

  const [rows, setRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [pendingValidRows, setPendingValidRows] = useState([]);

  // ✅ NEW: State to track if we are editing an existing history session
  const [editingSessionMetadata, setEditingSessionMetadata] = useState(null);

  // Fast-access refs for global keyboard shortcuts to prevent stale state closures
  const rowsRef = useRef(rows);
  const productsRef = useRef(products);
  const isSubmittingRef = useRef(isSubmitting);

  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, custRes] = await Promise.all([
          fetchWithCache('ferrari_inventory_cache', () => api.get(ENDPOINTS.INVENTORY), 60).catch(() => null),
          fetchWithCache('ferrari_customers_cache', () => api.get(ENDPOINTS.CUSTOMERS), 60).catch(() => null) 
        ]);
        
        let inventoryArray = [];
        if (Array.isArray(invRes)) inventoryArray = invRes;
        else if (invRes?.data && Array.isArray(invRes.data)) inventoryArray = invRes.data;
        else if (invRes?.data?.data && Array.isArray(invRes.data.data)) inventoryArray = invRes.data.data;

        let customerArray = [];
        if (Array.isArray(custRes)) customerArray = custRes;
        else if (custRes?.data && Array.isArray(custRes.data)) customerArray = custRes.data;
        else if (custRes?.data?.data && Array.isArray(custRes.data.data)) customerArray = custRes.data.data;
        
        const validInventory = inventoryArray.filter(item => item.product_name || item.product || item.name || item.itemName);
        
        const mappedInventory = validInventory.map((item, index) => {
          const baseName = item.product_name || item.product || item.name || item.itemName || `Unknown Product ${index}`;
          const weightStr = item.weight ? ` (${item.weight})` : '';
          
          return {
            id: item.inventory_id || item.id || `PROD-${Math.random().toString(36).substring(7)}`, 
            baseName: baseName,
            weight: item.weight || '',
            label: `${baseName}${weightStr}`.trim(), 
            isExtra: false 
          };
        });

        const PREDEFINED_LIST = [
          "FLOUR #2 JENAN ATTA 50 kg",
          "FLOUR #1 JENAN MAIDA 50kg",
          "EMIGRAIN PARATHA MAIDA 50kg",
          "GRAND MILL ALL BAKING FLOUR 50kg",
          "JANNAT ATTA 50kg",
          "HABIBI MAIDA 50kg",
          "FERRARI ALL BAKING FLOUR 50kg",
          "GOLDEN 5050 MAIDHA 50kg",
          "GOLDEN 2020 MAIDHA 50 kg",
          "NFM RAWAN 1 FLOUR 50KG",
          "FLOUR #2 JENAN ATTA 10KG",
          "FLOUR #1 JENAN MAIDA 10KG",
          "PAK 1 50KG",
          "EMIGRAIN PAK 2 50 KG",
          "SAHARA ARABIC 50KG",
          "GRAND MILL PARATHA MAIDA 50 KG",
          "WHEAT FLOUR AFGHAN ATTA JENAN 50 KG",
          "WHEAT FLOUR AFGHAN MAIDA JENAN 50 KG"
        ];

        const normalizeStr = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const predefinedNormalized = PREDEFINED_LIST.map(normalizeStr);

        const initialProducts = [];
        const extraProducts = [];

        mappedInventory.forEach(item => {
          const itemNorm = normalizeStr(item.label);
          const baseNorm = normalizeStr(item.baseName);
          
          const isPredefined = predefinedNormalized.some(p => {
            if (itemNorm === p || baseNorm === p) return true;
            if (itemNorm.length > 5 && p.includes(itemNorm)) return true;
            if (p.length > 5 && itemNorm.includes(p)) return true;
            return false;
          });

          if (isPredefined) {
            initialProducts.push(item);
          } else {
            extraProducts.push(item);
          }
        });

        if (initialProducts.length === 0 && mappedInventory.length > 0) {
          initialProducts.push(...mappedInventory.slice(0, 7));
          extraProducts.length = 0;
          extraProducts.push(...mappedInventory.slice(7));
        }

        if (initialProducts.length === 0 && mappedInventory.length === 0) {
          PREDEFINED_LIST.forEach((prodName, idx) => {
            const fallbackItem = { id: `FB-${idx}`, baseName: prodName, weight: '', label: prodName, isExtra: false };
            if (idx < 7) {
              initialProducts.push(fallbackItem);
            } else {
              extraProducts.push(fallbackItem);
            }
          });
        }

        setProducts(initialProducts);
        setAvailableExtraProducts(extraProducts);
        setCustomers(customerArray);

        const generateEmptyRow = () => ({
          id: Date.now() + Math.random(),
          companyName: '',
          products: initialProducts.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {}) 
        });

        setRows([generateEmptyRow(), generateEmptyRow()]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setModal({ isOpen: true, type: 'error', message: 'Failed to load master inventory list.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) setIsCalendarOpen(false);
      if (!event.target.closest('.company-input-cell')) {
        setActiveDropdown(null);
        setCustomerFocusedIndex(-1);
      }
      if (addColumnRef.current && !addColumnRef.current.contains(event.target)) {
        setIsAddColumnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // ✅ NEW: Hydrate Grid when "View" is clicked on History Table
  const handleLoadSession = (session) => {
    let newProducts = [...products];
    let newAvailableExtra = [...availableExtraProducts];

    // 1. Identify all products within this historical session
    const sessionProducts = [];
    session.deliveries.forEach(del => {
      (del.products || []).forEach(p => {
        const weightStr = p.weight ? ` (${p.weight})` : '';
        const label = `${p.product || p.product_name}${weightStr}`.trim();
        if (!sessionProducts.some(sp => sp.label === label)) {
          sessionProducts.push({ ...p, label });
        }
      });
    });

    // 2. Ensure all session products exist as active columns in the UI
    sessionProducts.forEach(sp => {
      const alreadyVisible = newProducts.find(p => p.label === sp.label);
      if (!alreadyVisible) {
        const extraItem = newAvailableExtra.find(p => p.label === sp.label);
        if (extraItem) {
          newProducts.push({ ...extraItem, isExtra: true });
          newAvailableExtra = newAvailableExtra.filter(p => p.label !== sp.label);
        } else {
          // Fallback if product was somehow deleted from master inventory
          newProducts.push({
            id: sp.inventory_id || `GHOST-${Math.random()}`,
            baseName: sp.product,
            weight: sp.weight,
            label: sp.label,
            isExtra: true
          });
        }
      }
    });

    setProducts(newProducts);
    setAvailableExtraProducts(newAvailableExtra);

    // 3. Map historical quantities back into the rows state
    const reconstructedRows = session.deliveries.map(del => {
      const rowProducts = newProducts.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {});
      
      (del.products || []).forEach(p => {
        const weightStr = p.weight ? ` (${p.weight})` : '';
        const label = `${p.product || p.product_name}${weightStr}`.trim();
        rowProducts[label] = p.qty.toString();
      });

      return {
        id: del.id || Date.now() + Math.random(),
        companyName: del.companyName || '',
        products: rowProducts
      };
    });

    if (reconstructedRows.length === 0) {
       reconstructedRows.push({
         id: Date.now() + Math.random(),
         companyName: '',
         products: newProducts.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
       });
    }

    setRows(reconstructedRows);
    setGlobalDate(session.deliveryDate);
    
    // Set Edit Mode Metadata
    setEditingSessionMetadata({
      location: session.location,
      trip: session.trip,
      deliveryDate: session.deliveryDate
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkSubmitClick = () => {
    const currentRows = rowsRef.current;
    const currentProducts = productsRef.current;
    
    const validRows = currentRows
      .filter(row => (row.companyName || '').trim().length > 0)
      .map(row => {
        const structuredProducts = currentProducts
          .filter(p => row.products[p.label] && parseInt(row.products[p.label], 10) > 0)
          .map(p => ({
            inventory_id: p.id,
            product: p.baseName, 
            weight: p.weight,    
            qty: parseInt(row.products[p.label], 10)
          }));

        return {
          companyName: row.companyName,
          structuredProducts
        };
      })
      .filter(row => row.structuredProducts.length > 0); 
    
    if (validRows.length === 0) {
        setModal({ isOpen: true, type: 'error', message: 'Please enter at least one valid order with product quantities.' });
        return;
    }

    setPendingValidRows(validRows);

    // ✅ If Editing, bypass modal and immediately update. Else, open New Setup Modal.
    if (editingSessionMetadata) {
      executeFinalSaveAndPDF({ 
        location: editingSessionMetadata.location, 
        trip: editingSessionMetadata.trip 
      });
    } else {
      setIsSetupModalOpen(true);
    }
  };

  const handleAddRow = () => {
    const newRowId = Date.now() + Math.random();
    
    setRows(prevRows => {
      const newRow = {
        id: newRowId,
        companyName: '',
        products: productsRef.current.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
      };
      return [...prevRows, newRow];
    });

    setTimeout(() => {
      const newRowInput = document.getElementById(`company-input-${newRowId}`);
      if (newRowInput) {
        newRowInput.focus();
      }
    }, 50);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Shift') {
        e.preventDefault();
        setIsAddColumnOpen(true);
        setTimeout(() => document.getElementById('column-search-input')?.focus(), 50);
      }
      if (e.ctrlKey && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault(); 
        handleAddRow();
      }
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!isSubmittingRef.current) {
          handleBulkSubmitClick();
        }
      }
      if (e.ctrlKey && e.key === 'Backspace') {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement?.tagName?.toLowerCase() === 'input';
        if (!isInputFocused || activeElement.value === '') {
          e.preventDefault();
          setRows(prevRows => (prevRows.length > 1 ? prevRows.slice(0, -1) : prevRows));
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); 

  useEffect(() => {
    if (activeItemRef.current) activeItemRef.current.scrollIntoView({ block: 'nearest' });
  }, [customerFocusedIndex, productFocusedIndex]);

  const handleAddColumn = (productToAdd) => {
    const newProduct = { ...productToAdd, isExtra: true }; 
    
    setProducts(prev => [...prev, newProduct]);
    setAvailableExtraProducts(prev => prev.filter(p => p.id !== productToAdd.id));
    
    setRows(prevRows => prevRows.map(row => ({
      ...row,
      products: { ...row.products, [newProduct.label]: '' }
    })));

    setIsAddColumnOpen(false);
    setColumnSearchQuery('');
    setProductFocusedIndex(0);
    setVisibleCount(50);

    setTimeout(() => {
      const targetRowId = lastActiveRowId || (rowsRef.current[0] ? rowsRef.current[0].id : null);
      if (targetRowId) {
        const safeLabel = newProduct.label.replace(/[^a-zA-Z0-9]/g, '-');
        const targetInput = document.getElementById(`input-${targetRowId}-${safeLabel}`);
        if (targetInput) targetInput.focus();
      }
    }, 100);
  };

  const handleRemoveRow = (id) => setRows(rows.filter(r => r.id !== id));

  const updateRowData = (id, field, value) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    if (field === 'companyName') setCustomerFocusedIndex(-1); 
  };

  const updateProductQty = (id, productLabel, value) => {
    const cleanValue = value.replace(/[^0-9]/g, ''); 
    setRows(rows.map(row => row.id === id ? { ...row, products: { ...row.products, [productLabel]: cleanValue } } : row));
  };

  const focusNextInput = (target) => {
    const currentRow = target.closest('tr');
    const allRows = Array.from(target.closest('tbody').querySelectorAll('tr'));
    
    if (currentRow) {
      const inputs = Array.from(currentRow.querySelectorAll('input:not([disabled])'));
      const currentIndex = inputs.indexOf(target);
      
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus(); 
      } else if (currentIndex === inputs.length - 1) {
        const rowIndex = allRows.indexOf(currentRow);
        if (rowIndex > -1 && rowIndex < allRows.length - 1) {
           const nextRowInputs = Array.from(allRows[rowIndex + 1].querySelectorAll('input'));
           if (nextRowInputs.length > 0) nextRowInputs[0].focus(); 
        } else if (rowIndex === allRows.length - 1) {
           handleAddRow(); 
        }
      }
    }
  };

  const handleRowKeyDown = (e, row, filteredCustomers) => {
    if (activeDropdown === row.id && filteredCustomers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCustomerFocusedIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomerFocusedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (customerFocusedIndex >= 0 && filteredCustomers[customerFocusedIndex]) {
          const selected = filteredCustomers[customerFocusedIndex];
          const name = selected.customerName || selected.company_name || selected.name;
          updateRowData(row.id, 'companyName', name);
        }
        setActiveDropdown(null);
        setCustomerFocusedIndex(-1);
        focusNextInput(e.target);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      setActiveDropdown(null);
      focusNextInput(e.target);
    }
  };

  const handleProductSearchKeyDown = (e, filteredProducts) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProductFocusedIndex(prev => {
        const newIndex = Math.min(prev + 1, filteredProducts.length - 1);
        if (newIndex >= visibleCount - 5) setVisibleCount(c => c + 50); 
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProductFocusedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (productFocusedIndex >= 0 && filteredProducts[productFocusedIndex]) {
        handleAddColumn(filteredProducts[productFocusedIndex]);
      }
    }
  };

  // ✅ UPADTED: Added Forked Update vs Save Logic
  const executeFinalSaveAndPDF = async ({ location, trip }) => {
    setIsSetupModalOpen(false);
    setIsSubmitting(true);
    
    try {
      if (editingSessionMetadata) {
        await api.put('/api/orders/bulk-excel/update', {
          deliveryDate: editingSessionMetadata.deliveryDate,
          location: editingSessionMetadata.location,
          trip: editingSessionMetadata.trip,         
          deliveries: pendingValidRows
        });
      } else {
        await api.post('/api/orders/bulk-excel', {
          deliveryDate: globalDate,
          location: location, 
          trip: trip,         
          deliveries: pendingValidRows
        });
      }
      
      generateDailyOrderPDF(pendingValidRows, products, {
        date: editingSessionMetadata ? editingSessionMetadata.deliveryDate : globalDate,
        location: editingSessionMetadata ? editingSessionMetadata.location : location,
        trip: editingSessionMetadata ? editingSessionMetadata.trip : trip
      });
      
      setModal({ 
        isOpen: true, 
        type: 'success', 
        message: editingSessionMetadata ? 'Deliveries updated and ledger reconciled.' : 'Deliveries synced and Dispatch PDF generated.' 
      });
      
      const generateEmptyRow = () => ({
        id: Date.now() + Math.random(),
        companyName: '',
        products: products.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
      });
      setRows([generateEmptyRow(), generateEmptyRow()]); 
      setEditingSessionMetadata(null); // Clear Edit state

    } catch (error) {
      console.error("Error submitting bulk data:", error);
      setModal({ 
        isOpen: true, 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to sync. Check your network connection.' 
      });
    } finally {
      setIsSubmitting(false);
      setPendingValidRows([]);
    }
  };

  const inputClasses = "w-full px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-light focus:ring-2 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-400 shadow-sm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  const filteredExtraProducts = availableExtraProducts.filter(p => 
    p.label.toLowerCase().includes(columnSearchQuery.toLowerCase())
  );
  
  const displayedExtraProducts = filteredExtraProducts.slice(0, visibleCount);

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative z-0">
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-50">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Delivery Form Gen</h2>
          <p className="text-slate-600 text-sm mt-1.5 font-medium tracking-wide">
            {editingSessionMetadata ? (
              <span className="text-amber-600 font-bold flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span>
                Editing Session: {editingSessionMetadata.location} - {editingSessionMetadata.trip}
              </span>
            ) : "High-efficiency mass entry grid."}
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative z-50" ref={calendarRef}>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!editingSessionMetadata) setIsCalendarOpen(prev => !prev); 
              }}
              className={`flex items-center gap-4 bg-white px-5 py-2.5 rounded-full border border-slate-300 shadow-sm transition-colors ${editingSessionMetadata ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-light/50'}`}
              title={editingSessionMetadata ? "Cannot change date while editing" : "Select Date"}
            >
              <svg className="w-5 h-5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-slate-900 font-bold pointer-events-none">
                {new Date(globalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </button>

            {isCalendarOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-50 animate-in slide-in-from-top-2 fade-in duration-200 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] rounded-[1.5rem] bg-white border border-slate-200">
                <PremiumCalendar 
                  selectedDate={globalDate} 
                  onSelectDate={(date) => {
                    setGlobalDate(date);
                    setIsCalendarOpen(false);
                  }} 
                />
              </div>
            )}
          </div>

          {/* Cancel Edit Button */}
          {editingSessionMetadata && (
            <button
              onClick={() => {
                setEditingSessionMetadata(null);
                const generateEmptyRow = () => ({
                  id: Date.now() + Math.random(),
                  companyName: '',
                  products: products.reduce((acc, curr) => ({ ...acc, [curr.label]: '' }), {})
                });
                setRows([generateEmptyRow(), generateEmptyRow()]); 
              }}
              className="px-6 py-2.5 rounded-full font-bold transition-all duration-300 text-slate-600 bg-white border border-slate-300 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          )}

          <button 
            onClick={handleBulkSubmitClick} 
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-sm text-white hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 ${editingSessionMetadata ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-dark hover:bg-[#1E1A2F]'}`}
          >
            {isSubmitting ? 'Syncing...' : (editingSessionMetadata ? 'Update Deliveries →' : 'Save Deliveries →')}
          </button>
        </div>
      </div>

      <div className={`bg-[#FCFCFD] rounded-[2rem] border shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden relative z-10 transition-colors duration-300 ${editingSessionMetadata ? 'border-amber-200 shadow-amber-100/50' : 'border-slate-200'}`}>
        <div className="overflow-x-auto pb-4 min-h-[450px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left border-collapse whitespace-nowrap relative">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60">
                <th className="p-4 text-xs font-bold text-slate-600 uppercase tracking-widest w-[50px] text-center">#</th>
                <th className="p-4 text-xs font-bold text-slate-600 uppercase tracking-widest min-w-[250px]">Company Name</th>
                {products.map(p => (
                  <th key={p.id} className={`p-4 text-[11px] font-bold uppercase tracking-widest text-center min-w-[120px] ${p.isExtra ? 'text-brand-dark' : 'text-slate-600'}`}>
                    {p.label}
                  </th>
                ))}
                
                <th className="p-4 text-xs font-bold text-slate-600 text-center w-[60px] relative" ref={addColumnRef}>
                  <button 
                    onClick={() => setIsAddColumnOpen(!isAddColumnOpen)}
                    className="w-8 h-8 rounded-full border-2 border-slate-300 border-dashed flex items-center justify-center text-slate-400 hover:text-brand-dark hover:border-brand-dark hover:bg-brand-light/10 transition-colors mx-auto"
                    title="Add extra product column (Shortcut: Ctrl + Shift)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  </button>

                  {isAddColumnOpen && (
                    <div className="absolute top-[calc(100%+8px)] right-0 w-64 bg-white border border-slate-200 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-2 mb-2">
                        <input 
                          id="column-search-input"
                          type="text" 
                          autoFocus
                          placeholder="Search products..." 
                          value={columnSearchQuery}
                          onChange={(e) => {
                            setColumnSearchQuery(e.target.value);
                            setProductFocusedIndex(0); 
                            setVisibleCount(50);
                          }}
                          onKeyDown={(e) => handleProductSearchKeyDown(e, filteredExtraProducts)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-brand-light font-medium placeholder-slate-400"
                        />
                      </div>
                      
                      <div 
                        className="max-h-60 overflow-y-auto"
                        onScroll={(e) => {
                          const { scrollTop, scrollHeight, clientHeight } = e.target;
                          if (scrollTop + clientHeight >= scrollHeight - 20) {
                            setVisibleCount(prev => prev + 50);
                          }
                        }}
                      >
                        {displayedExtraProducts.map((p, idx) => {
                            const isFocused = productFocusedIndex === idx;
                            return (
                              <div 
                                key={p.id}
                                ref={isFocused ? activeItemRef : null}
                                onClick={() => handleAddColumn(p)}
                                className={`px-3 py-2.5 text-sm cursor-pointer font-semibold transition-colors text-left truncate rounded-lg ${
                                  isFocused ? 'bg-brand-light/10 text-brand-dark' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {p.label}
                              </div>
                            );
                          })}
                        {displayedExtraProducts.length === 0 && (
                          <div className="px-3 py-4 text-xs text-slate-500 text-center italic">No matching products in stock.</div>
                        )}
                      </div>
                    </div>
                  )}
                </th>

                <th className="p-4 text-xs font-bold text-slate-600 uppercase tracking-widest text-center w-[60px]"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-sm">
              {rows.map((row, index) => {
                const filteredCustomers = customers
                  .filter(c => {
                    const matchStr = (c.customerName || c.company_name || c.name || '').toLowerCase();
                    const inputStr = (row.companyName || '').toLowerCase();
                    return matchStr.includes(inputStr);
                  })
                  .slice(0, 50);

                return (
                  <tr key={row.id} className="group hover:bg-slate-50 transition-colors relative">
                    <td className="p-2 text-center text-slate-500 font-bold text-sm">{index + 1}</td>
                    
                    <td className="p-2 relative company-input-cell">
                      <input 
                        id={`company-input-${row.id}`}
                        type="text" 
                        placeholder="Search Client / Company" 
                        value={row.companyName || ''} 
                        onChange={(e) => {
                          updateRowData(row.id, 'companyName', e.target.value);
                          setActiveDropdown(row.id); 
                        }} 
                        onFocus={() => {
                          setActiveDropdown(row.id);
                          setLastActiveRowId(row.id);
                        }}
                        onKeyDown={(e) => handleRowKeyDown(e, row, filteredCustomers)} 
                        className={inputClasses} 
                      />

                      {activeDropdown === row.id && customers.length > 0 && (
                        <div className="absolute top-[calc(100%-8px)] left-2 w-[calc(100%-16px)] max-h-56 overflow-y-auto bg-white border border-slate-200 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15)] rounded-xl z-40 py-2">
                          {filteredCustomers.map((c, idx) => {
                              const name = c.customerName || c.company_name || c.name;
                              const isFocused = customerFocusedIndex === idx;
                              return (
                                <div 
                                  key={c.id || Math.random()} 
                                  ref={isFocused ? activeItemRef : null}
                                  className={`px-4 py-2.5 text-sm cursor-pointer font-bold transition-colors ${
                                    isFocused ? 'bg-brand-light/10 text-brand-dark' : 'text-slate-800 hover:bg-slate-50'
                                  }`}
                                  onClick={() => {
                                    updateRowData(row.id, 'companyName', name);
                                    setActiveDropdown(null);
                                    setCustomerFocusedIndex(-1);
                                  }}
                                >
                                  {name}
                                </div>
                              );
                            })
                          }
                          
                          {filteredCustomers.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 italic font-medium">No matches found.</div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {products.map(p => (
                      <td key={p.id} className="p-2">
                        <input 
                          id={`input-${row.id}-${p.label.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          type="text" 
                          placeholder="-"
                          value={row.products[p.label] || ''} 
                          onChange={(e) => updateProductQty(row.id, p.label, e.target.value)} 
                          onKeyDown={(e) => handleRowKeyDown(e, row, [])}
                          onFocus={() => setLastActiveRowId(row.id)}
                          className={`${inputClasses} text-center font-bold text-brand-dark`}
                        />
                      </td>
                    ))}
                    
                    <td className="p-2 text-center align-middle"></td>

                    <td className="p-2 text-center align-middle">
                      <button 
                        onClick={() => handleRemoveRow(row.id)} 
                        disabled={rows.length === 1}
                        className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 hover:shadow-sm transition-all duration-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-slate-100/50 border-t border-slate-200 flex items-center justify-center relative z-0">
          <button 
            onClick={handleAddRow} 
            className="flex items-center gap-2 text-sm font-bold text-brand-dark hover:text-brand-light bg-white px-6 py-2.5 border border-slate-300 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
            title="Add a new row (Shortcut: Ctrl + Space)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Add Rows
          </button>
        </div>
      </div>

      {/* ✅ NEW: Delivery History Component Added Here */}
      <DeliveryHistoryTable onViewSession={handleLoadSession} />

      {modal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setModal({ ...modal, isOpen: false })}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-[0_20px_60px_rgb(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${modal.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {modal.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                {modal.type === 'success' ? 'Sync Complete' : 'Sync Failed'}
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8">
                {modal.message}
              </p>
              <button onClick={() => setModal({ ...modal, isOpen: false })} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg">
                Okay, got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      <DeliverySetupModal 
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onConfirm={executeFinalSaveAndPDF}
      />
    </div>
  );
}