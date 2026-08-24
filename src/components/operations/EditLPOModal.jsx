// frontend/src/components/operations/EditLPOModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../../config/api';
import LPOItemTypeahead from './LPOItemTypeahead';
import { fetchWithCache } from '../../utils/cacheUtils';

const baseInputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

// Full AED Amount in Words Conversion Engine
const numberToWordsAED = (num) => {
  if (!num || num === 0) return 'ZERO AED ONLY';
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'OVERFLOW';
    n = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'AND ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
  };

  const parts = parseFloat(num).toFixed(2).split('.');
  const dirhams = parseInt(parts[0], 10);
  const fils = parseInt(parts[1], 10);

  let result = `${inWords(dirhams)} DIRHAMS`;
  if (fils > 0) {
    result += ` AND ${inWords(fils)} FILS`;
  }
  return result + ' ONLY';
};

const generateItemId = () => `ITEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export default function EditLPOModal({ lpoData, onClose, onSuccess }) {
    const [vendorData, setVendorData] = useState({
        deliveryDate: '',
        deliveryTime: 'AFTERNOON',
        paymentTerms: '',
        vendorName: '',
        payeeDetails: '',
        purchaseOrganization: '',
        deliveryAddress: ''
    });
    const [items, setItems] = useState([]);
    const [footerData, setFooterData] = useState({ preparedBy: '', remarks: '' });
    const [totals, setTotals] = useState({ subTotal: 0, vat: 0, netAmount: 0 });
    const [amountInWords, setAmountInWords] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventory, setInventory] = useState([]);

    // Custom Popover States
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

    // Vendor Search & Auto-Fill Typeahead State
    const [savedVendors, setSavedVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);
    const [vendorActiveIndex, setVendorActiveIndex] = useState(-1);

    const payeeRef = useRef(null);
    const vendorListRef = useRef(null);

    // Reset vendor active index when filtered list updates
    useEffect(() => {
        setVendorActiveIndex(-1);
    }, [filteredVendors]);

    // Scroll active vendor item into view
    useEffect(() => {
        if (showVendorDropdown && vendorActiveIndex >= 0 && vendorListRef.current) {
            const activeEl = vendorListRef.current.children[vendorActiveIndex];
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [vendorActiveIndex, showVendorDropdown]);

    // Load saved vendors on mount
    useEffect(() => {
        const loadVendors = async () => {
            try {
                const response = await api.get('/api/vendors');
                if (response.data && response.data.data) {
                    setSavedVendors(response.data.data);
                }
            } catch (error) {
                console.error("Failed to load vendors:", error);
            }
        };
        loadVendors();
    }, []);

    // Initialize data from lpoData on mount
    useEffect(() => {
        if (lpoData) {
            setVendorData({
                deliveryDate: lpoData.deliveryDate || '',
                deliveryTime: lpoData.deliveryTime || 'AFTERNOON',
                paymentTerms: lpoData.paymentTerms || '',
                vendorName: lpoData.vendorName || '',
                payeeDetails: lpoData.payeeDetails || '',
                purchaseOrganization: lpoData.purchaseOrganization || '',
                deliveryAddress: lpoData.deliveryAddress || ''
            });

            const mappedItems = (lpoData.items || []).map((item, index) => {
                const qty = Math.max(0, parseFloat(item.qty) || 0);
                const price = Math.max(0, parseFloat(item.purchasePrice) || 0);
                const kg = item.kg !== undefined ? item.kg : 50;
                const uom = item.uom || 'BAGS';
                const uomConversion = item.uomConversion || `1 ${uom}=${kg} KG`;
                return {
                    id: generateItemId() + index,
                    description: item.description || '',
                    kg: kg,
                    qty: item.qty || '',
                    uom: uom,
                    uomConversion: uomConversion,
                    purchasePrice: item.purchasePrice || '',
                    total: parseFloat((qty * price).toFixed(2))
                };
            });
            setItems(mappedItems.length > 0 ? mappedItems : [getEmptyItem()]);

            setFooterData({
                preparedBy: lpoData.preparedBy || '',
                remarks: lpoData.remarks || ''
            });

            setTotals({
                subTotal: lpoData.subTotal || 0,
                vat: lpoData.vatAmount || 0,
                netAmount: lpoData.netAmount || 0
            });
            setAmountInWords(lpoData.amountInWords || numberToWordsAED(lpoData.netAmount || 0));

            if (lpoData.deliveryDate) {
                setCalendarViewDate(new Date(lpoData.deliveryDate));
            }
        }
        fetchInventory();
    }, [lpoData]);

    const fetchInventory = async () => {
        try {
            const response = await fetchWithCache('ferrari_inventory_cache', () => api.get('/api/inventory'), 60);
            const rawData = response?.data || response;
            const invList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
            setInventory(invList);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        }
    };

    const getEmptyItem = () => ({
        id: generateItemId(), description: '', kg: '50', qty: '', uom: 'BAGS', uomConversion: '1 BAG=50 KG', purchasePrice: '', total: 0
    });

    const calculateTotals = (currentItems) => {
        let sub = 0;
        currentItems.forEach(item => {
            sub += item.total || 0;
        });
        const subTotalRounded = Math.round(sub * 100) / 100;
        const vat = Math.round(subTotalRounded * 0.05 * 100) / 100;
        const netAmount = Math.round((subTotalRounded + vat) * 100) / 100;

        setTotals({ subTotal: subTotalRounded, vat, netAmount });
        setAmountInWords(numberToWordsAED(netAmount));
    };

    const handleVendorChange = (field, value) => setVendorData(prev => ({ ...prev, [field]: value }));
    const handleFooterChange = (field, value) => setFooterData(prev => ({ ...prev, [field]: value }));

    // Vendor Search & Auto-Fill Handlers
    const handleVendorSearch = (e) => {
        const value = e.target.value;
        handleVendorChange('vendorName', value);

        if (value.trim().length > 0) {
            const upperValue = value.toUpperCase();
            const matches = savedVendors.filter(v => 
                v.vendorName?.toUpperCase().includes(upperValue) || 
                v.vendor_id?.toUpperCase().includes(upperValue)
            );
            setFilteredVendors(matches);
            setShowVendorDropdown(true);
        } else {
            setShowVendorDropdown(false);
        }
    };

    const handleVendorSelect = (vendor) => {
        handleVendorChange('vendorName', vendor.vendorName);
        handleVendorChange('payeeDetails', vendor.payeeDetails);
        setShowVendorDropdown(false);
        setVendorActiveIndex(-1);

        setTimeout(() => {
            if (payeeRef.current) {
                payeeRef.current.focus();
                payeeRef.current.select();
            }
        }, 50);
    };

    const handleVendorKeyDown = (e) => {
        if (showVendorDropdown && filteredVendors.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setVendorActiveIndex(prev => (prev < filteredVendors.length - 1 ? prev + 1 : prev));
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setVendorActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (vendorActiveIndex >= 0 && filteredVendors[vendorActiveIndex]) {
                    e.preventDefault();
                    handleVendorSelect(filteredVendors[vendorActiveIndex]);
                    return;
                }
            } else if (e.key === 'Escape') {
                setShowVendorDropdown(false);
                return;
            }
        }
        handleKeyDown(e);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const isTextInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if (!isTextInput) return;

            e.preventDefault();
            const container = e.target.closest('.lpo-modal-container');
            if (container) {
                const inputs = Array.from(
                    container.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input[type="number"]:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])')
                );
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else if (currentIndex === inputs.length - 1) {
                    addItemRow();
                    setTimeout(() => {
                        const updatedInputs = Array.from(
                            container.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input[type="number"]:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])')
                        );
                        if (updatedInputs.length > inputs.length) {
                            updatedInputs[currentIndex + 1].focus();
                        }
                    }, 100);
                }
            }
        }
    };

    const handleItemChange = (id, field, value) => {
        let cleanValue = value;
        if (['kg', 'qty', 'purchasePrice'].includes(field)) {
            if (parseFloat(value) < 0) cleanValue = '0';
        }

        const updatedItems = items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: cleanValue };

                const qty = Math.max(0, parseFloat(updatedItem.qty) || 0);
                const price = Math.max(0, parseFloat(updatedItem.purchasePrice) || 0);
                updatedItem.total = parseFloat((qty * price).toFixed(2));

                if (field === 'kg' && updatedItem.uom === 'BAGS') {
                    updatedItem.uomConversion = `1 BAG=${cleanValue} KG`;
                }
                return updatedItem;
            }
            return item;
        });

        setItems(updatedItems);
        calculateTotals(updatedItems);
    };

    const handleProductSelect = (rowId, product) => {
        const kgMatch = product.weight?.match(/\d+/);
        const kgVal = kgMatch ? kgMatch[0] : '50';
        const priceVal = product.price ? product.price.toString() : '';

        const updatedItems = items.map(item => {
            if (item.id === rowId) {
                const updatedItem = {
                    ...item,
                    description: product.product_name,
                    kg: kgVal,
                    purchasePrice: priceVal,
                    uomConversion: `1 BAG=${kgVal} KG`
                };

                const qty = Math.max(0, parseFloat(updatedItem.qty) || 0);
                updatedItem.total = parseFloat((qty * Math.max(0, parseFloat(priceVal || 0))).toFixed(2));

                return updatedItem;
            }
            return item;
        });

        setItems(updatedItems);
        calculateTotals(updatedItems);
    };

    const addItemRow = () => {
        const newItems = [...items, getEmptyItem()];
        setItems(newItems);
        calculateTotals(newItems);
    };

    const removeItemRow = (id) => {
        if (items.length > 1) {
            const updatedItems = items.filter(item => item.id !== id);
            setItems(updatedItems);
            calculateTotals(updatedItems);
        }
    };

    const handleDateSelect = (year, month, day) => {
        const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        handleVendorChange('deliveryDate', formatted);
        setIsCalendarOpen(false);
    };

    const isFormValid = () => {
        return vendorData.vendorName && vendorData.deliveryAddress && footerData.preparedBy &&
            items.every(i => i.description && i.description.length >= 2 && parseFloat(i.qty) > 0 && parseFloat(i.purchasePrice) > 0);
    };

    const handleSubmit = async () => {
        if (!isFormValid() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const activeBranch = localStorage.getItem('active_branch');
            const payload = {
                branchId: activeBranch,
                ...vendorData,
                ...footerData,
                items,
                amountInWords
            };

            const res = await api.put(`/api/lpo/${lpoData.lpoId}`, payload);
            if (res.data.success) {
                onSuccess();
            }
        } catch (error) {
            console.error("Failed to update LPO:", error);
            alert("Error updating LPO. Please check your inputs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto lpo-modal-container">
            {/* Modal Container */}
            <div className="bg-[#FCFCFD] rounded-[2rem] shadow-2xl w-full max-w-5xl my-auto relative flex flex-col max-h-[95vh] border border-slate-200/60 animate-in zoom-in-95 duration-200">

                {/* Header - Read Only ID Section */}
                <div className="p-6 md:p-8 border-b border-slate-200/60 flex justify-between items-center bg-white rounded-t-[2rem]">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Local Purchase Order</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-slate-400">Order No:</span>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <span className="text-xs font-bold text-slate-700">{lpoData?.orderNo}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <div className="overflow-y-auto p-6 md:p-8 flex-1">

                    {/* SECTION 1: Logistics & Vendor Data */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">1. Logistics & Vendor Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Custom Calendar Date Picker */}
                            <div className={`relative ${isCalendarOpen ? 'z-[100]' : 'z-10'}`}>
                                <label className={labelClasses}>Delivery Date</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className={`${baseInputClasses} flex justify-between items-center text-left ${!vendorData.deliveryDate ? 'text-slate-400' : 'text-slate-900'}`}
                                >
                                    {vendorData.deliveryDate || 'Select Date'}
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </button>
                                {isCalendarOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsCalendarOpen(false)}></div>
                                        <div className="absolute top-[calc(100%+8px)] left-0 p-5 bg-white rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100/80 z-[120] w-[280px] animate-in zoom-in-95">
                                            <div className="flex justify-between items-center mb-5">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
                                                    &lt;
                                                </button>
                                                <div className="text-[15px] font-bold text-slate-900">{calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
                                                    &gt;
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {Array.from({ length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                                    const day = i + 1;
                                                    const dateString = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => handleDateSelect(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day)}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${vendorData.deliveryDate === dateString ? 'bg-brand-dark text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Custom Dropdown Time Picker */}
                            <div className={`relative ${isTimeDropdownOpen ? 'z-[100]' : 'z-10'}`}>
                                <label className={labelClasses}>Delivery Time</label>
                                <button
                                    type="button"
                                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                                    className={`${baseInputClasses} flex justify-between items-center text-left capitalize`}
                                >
                                    {vendorData.deliveryTime.toLowerCase()}
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isTimeDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsTimeDropdownOpen(false)}></div>
                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-[120] overflow-hidden animate-in fade-in">
                                            {['MORNING', 'AFTERNOON', 'EVENING'].map(time => (
                                                <div
                                                    key={time}
                                                    onClick={() => { handleVendorChange('deliveryTime', time); setIsTimeDropdownOpen(false); }}
                                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 capitalize border-b border-slate-50 last:border-0"
                                                >
                                                    {time.toLowerCase()}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className={labelClasses}>Payment Terms</label>
                                <input type="text" onKeyDown={handleKeyDown} value={vendorData.paymentTerms} onChange={e => handleVendorChange('paymentTerms', e.target.value)} className={baseInputClasses} placeholder="e.g., 60 days (SOA Date)" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dynamic Stacking Context & Typeahead Dropdown for Vendor Search */}
                            <div className={`relative ${showVendorDropdown ? 'z-[100]' : 'z-10'}`}>
                                <label className={labelClasses}>Vendor Name & Address</label>
                                <textarea
                                    rows="3"
                                    onKeyDown={handleVendorKeyDown}
                                    value={vendorData.vendorName}
                                    onChange={handleVendorSearch}
                                    onFocus={() => {
                                        if (vendorData.vendorName && filteredVendors.length > 0) setShowVendorDropdown(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowVendorDropdown(false), 200)}
                                    className={`${baseInputClasses} resize-none uppercase`}
                                    placeholder="AL GHURAIR FOODS LLC&#10;DUBAI, U.A.E"
                                />
                                {showVendorDropdown && filteredVendors.length > 0 && (
                                    <div
                                        ref={vendorListRef}
                                        className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[120] max-h-56 overflow-y-auto animate-in fade-in zoom-in-95"
                                    >
                                        {filteredVendors.map((vendor, index) => (
                                            <div
                                                key={vendor.vendor_id}
                                                onClick={() => handleVendorSelect(vendor)}
                                                className={`px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${
                                                    vendorActiveIndex === index
                                                        ? 'bg-brand-light/10 border-l-4 border-l-brand-dark'
                                                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                                                }`}
                                            >
                                                <div className={`text-sm font-bold ${vendorActiveIndex === index ? 'text-brand-dark' : 'text-slate-800'}`}>
                                                    {vendor.vendorName}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5 truncate">{vendor.payeeDetails}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClasses}>Payee Details</label>
                                <textarea
                                    ref={payeeRef}
                                    rows="3"
                                    onKeyDown={handleKeyDown}
                                    value={vendorData.payeeDetails}
                                    onChange={e => handleVendorChange('payeeDetails', e.target.value)}
                                    className={`${baseInputClasses} resize-none uppercase`}
                                    placeholder="AL GHURAIR FOODS LLC&#10;DUBAI, U.A.E"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Purchase Organization</label>
                                <textarea rows="2" onKeyDown={handleKeyDown} value={vendorData.purchaseOrganization} onChange={e => handleVendorChange('purchaseOrganization', e.target.value)} className={`${baseInputClasses} resize-none uppercase`} />
                            </div>
                            <div>
                                <label className={labelClasses}>Delivery Address</label>
                                <textarea rows="2" onKeyDown={handleKeyDown} value={vendorData.deliveryAddress} onChange={e => handleVendorChange('deliveryAddress', e.target.value)} className={`${baseInputClasses} resize-none uppercase`} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Items Grid */}
                    <div className="mb-8 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">2. Item Details</h3>
                        <div className="space-y-3">
                            <div className="hidden lg:flex gap-4 px-2">
                                <div className="w-[30%]"><span className={labelClasses}>Item Description</span></div>
                                <div className="w-[10%]"><span className={labelClasses}>KG</span></div>
                                <div className="w-[10%]"><span className={labelClasses}>QTY</span></div>
                                <div className="w-[10%]"><span className={labelClasses}>UOM</span></div>
                                <div className="w-[15%]"><span className={labelClasses}>Conversion</span></div>
                                <div className="w-[12%]"><span className={labelClasses}>Price (AED)</span></div>
                                <div className="w-[13%] text-right"><span className={labelClasses}>Total (AED)</span></div>
                                <div className="w-10"></div>
                            </div>

                            {items.map((item) => (
                                <div key={item.id} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                                    <LPOItemTypeahead
                                        value={item.description}
                                        onChange={(val) => handleItemChange(item.id, 'description', val)}
                                        onSelect={(product) => handleProductSelect(item.id, product)}
                                        inventory={inventory}
                                        baseInputClasses={baseInputClasses}
                                        parentOnKeyDown={handleKeyDown}
                                    />
                                    <div className="w-full lg:w-[10%]"><input type="number" min="0" onKeyDown={handleKeyDown} placeholder="50" value={item.kg} onChange={e => handleItemChange(item.id, 'kg', e.target.value)} className={baseInputClasses} /></div>
                                    <div className="w-full lg:w-[10%]"><input type="number" min="0" onKeyDown={handleKeyDown} placeholder="0" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} className={baseInputClasses} /></div>
                                    <div className="w-full lg:w-[10%]"><input type="text" onKeyDown={handleKeyDown} value={item.uom} onChange={e => handleItemChange(item.id, 'uom', e.target.value)} className={baseInputClasses} readOnly /></div>
                                    <div className="w-full lg:w-[15%]"><input type="text" onKeyDown={handleKeyDown} value={item.uomConversion} className={`${baseInputClasses} bg-slate-50 text-slate-500`} readOnly /></div>
                                    <div className="w-full lg:w-[12%]"><input type="number" min="0" step="0.01" onKeyDown={handleKeyDown} placeholder="0.00" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', e.target.value)} className={baseInputClasses} /></div>
                                    <div className="w-full lg:w-[13%] flex justify-end">
                                        <div className="px-4 py-3 text-slate-800 font-bold bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-full text-right">
                                            {item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeItemRow(item.id)} disabled={items.length === 1} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition-all duration-200 disabled:opacity-30">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            <div className="pt-2">
                                <button type="button" onClick={addItemRow} className="flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand-light bg-white px-5 py-2.5 border border-slate-200 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                    Add Item Row
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Summary & Footer */}
                    <div className="flex flex-col xl:flex-row justify-between gap-12">
                        <div className="flex-1 space-y-5">
                            <div>
                                <label className={labelClasses}>Amount In Words</label>
                                <div className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold tracking-wide text-sm">{amountInWords}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClasses}>Prepared By</label>
                                    <input type="text" onKeyDown={handleKeyDown} value={footerData.preparedBy} onChange={e => handleFooterChange('preparedBy', e.target.value)} className={`${baseInputClasses} uppercase`} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Remarks (Optional)</label>
                                    <input type="text" onKeyDown={handleKeyDown} value={footerData.remarks} onChange={e => handleFooterChange('remarks', e.target.value)} className={baseInputClasses} />
                                </div>
                            </div>
                        </div>
                        <div className="w-full xl:w-[320px] bg-slate-50/80 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-end space-y-3">
                            <div className="flex justify-between items-center"><span className="text-sm text-slate-500">Subtotal</span><span className="font-semibold text-slate-800">{totals.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-slate-500">VAT (5%)</span><span className="font-semibold text-slate-800">{totals.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                            <div className="pt-3 border-t border-slate-200/80 flex justify-between items-center"><span className="text-sm font-bold text-slate-900 uppercase">Net Amount</span><span className="text-xl font-bold text-emerald-600">AED {totals.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-6 border-t border-slate-200/60 bg-slate-50 rounded-b-[2rem] flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isFormValid()}
                        className={`px-8 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2 ${isFormValid() && !isSubmitting ? 'bg-brand-dark text-white hover:bg-brand-light' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}