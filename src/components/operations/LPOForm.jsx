// frontend/src/components/operations/LPOForm.jsx
import React from 'react';

const baseInputClasses = "w-full px-4 py-3 bg-white hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-brand-light focus:ring-4 focus:ring-brand-light/10 rounded-xl text-slate-900 font-medium outline-none transition-all placeholder-slate-300 shadow-sm";
const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

export default function LPOForm({
  vendorData,
  handleVendorChange,
  items,
  handleItemChange,
  addItemRow,
  removeItemRow,
  footerData,
  handleFooterChange,
  totals,
  amountInWords,
  isSubmitting,
  handleSubmit,
  isFormValid
}) {
  return (
    <div className="bg-[#FCFCFD] rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden z-10 relative">
      
      {/* SECTION 1: Logistics & Vendor Data */}
      <div className="p-8 border-b border-slate-200/60">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">1. Logistics & Vendor Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className={labelClasses}>Delivery Date</label>
            <input 
              type="date" 
              value={vendorData.deliveryDate} 
              onChange={e => handleVendorChange('deliveryDate', e.target.value)} 
              className={baseInputClasses} 
            />
          </div>
          <div>
            <label className={labelClasses}>Delivery Time</label>
            <div className="relative">
                <select 
                value={vendorData.deliveryTime} 
                onChange={e => handleVendorChange('deliveryTime', e.target.value)} 
                className={`${baseInputClasses} appearance-none cursor-pointer`}
                >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
          </div>
          <div>
            <label className={labelClasses}>Payment Terms</label>
            <input 
              type="text" 
              value={vendorData.paymentTerms} 
              onChange={e => handleVendorChange('paymentTerms', e.target.value)} 
              className={baseInputClasses} 
              placeholder="e.g., 60 days (SOA Date)" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Vendor Name & Address</label>
            <textarea 
              rows="3" 
              value={vendorData.vendorName} 
              onChange={e => handleVendorChange('vendorName', e.target.value)} 
              className={`${baseInputClasses} resize-none`} 
              placeholder="Vendor LLC&#10;Dubai, U.A.E" 
            />
          </div>
          <div>
            <label className={labelClasses}>Payee Details</label>
            <textarea 
              rows="3" 
              value={vendorData.payeeDetails} 
              onChange={e => handleVendorChange('payeeDetails', e.target.value)} 
              className={`${baseInputClasses} resize-none`} 
              placeholder="Payee LLC&#10;Dubai, U.A.E" 
            />
          </div>
          <div>
            <label className={labelClasses}>Purchase Organization</label>
            <textarea 
              rows="2" 
              value={vendorData.purchaseOrganization} 
              onChange={e => handleVendorChange('purchaseOrganization', e.target.value)} 
              className={`${baseInputClasses} resize-none`} 
            />
          </div>
          <div>
            <label className={labelClasses}>Delivery Address</label>
            <textarea 
              rows="2" 
              value={vendorData.deliveryAddress} 
              onChange={e => handleVendorChange('deliveryAddress', e.target.value)} 
              className={`${baseInputClasses} resize-none`} 
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Items Grid */}
      <div className="p-8 border-b border-slate-200/60 bg-slate-50/30">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">2. Item Details</h3>
        </div>

        <div className="space-y-3">
          {/* Table Header (Hidden on mobile/tablet) */}
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
            <div key={item.id} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-white p-4 lg:p-0 rounded-2xl lg:bg-transparent lg:border-none border border-slate-100 shadow-sm lg:shadow-none group">
              <div className="w-full lg:w-[30%]">
                <input 
                  type="text" 
                  placeholder="e.g., SPECIAL PARATHA" 
                  value={item.description} 
                  onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                  className={`${baseInputClasses} uppercase`} 
                />
              </div>
              <div className="w-full lg:w-[10%] flex gap-2">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center w-12">KG:</span>
                <input 
                  type="number" 
                  placeholder="50" 
                  value={item.kg} 
                  onChange={e => handleItemChange(item.id, 'kg', e.target.value)} 
                  className={baseInputClasses} 
                />
              </div>
              <div className="w-full lg:w-[10%] flex gap-2">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center w-12">QTY:</span>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={item.qty} 
                  onChange={e => handleItemChange(item.id, 'qty', e.target.value)} 
                  className={baseInputClasses} 
                />
              </div>
              <div className="w-full lg:w-[10%] flex gap-2">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center w-12">UOM:</span>
                <input 
                  type="text" 
                  value={item.uom} 
                  onChange={e => handleItemChange(item.id, 'uom', e.target.value)} 
                  className={baseInputClasses} 
                  readOnly 
                />
              </div>
              <div className="w-full lg:w-[15%] flex gap-2">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center w-12">Conv:</span>
                <input 
                  type="text" 
                  value={item.uomConversion} 
                  className={`${baseInputClasses} bg-slate-50 text-slate-500`} 
                  readOnly 
                />
              </div>
              <div className="w-full lg:w-[12%] flex gap-2 relative">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center w-12">Price:</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={item.purchasePrice} 
                  onChange={e => handleItemChange(item.id, 'purchasePrice', e.target.value)} 
                  className={`${baseInputClasses} pr-8`} 
                />
              </div>
              <div className="w-full lg:w-[13%] flex justify-end">
                <span className="lg:hidden text-xs text-slate-400 font-bold uppercase tracking-wider self-center mr-auto">Total:</span>
                <div className="px-4 py-3 text-slate-800 font-bold bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-full text-right">
                  {item.total.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </div>
              </div>
              <button 
                onClick={() => removeItemRow(item.id)} 
                disabled={items.length === 1}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition-all duration-200 disabled:opacity-30 lg:mt-0 mt-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          
          <div className="pt-4">
            <button 
              onClick={addItemRow} 
              className="flex items-center gap-2 text-sm font-semibold text-brand-dark hover:text-brand-light bg-white px-5 py-2.5 border border-slate-200 hover:border-brand-light/30 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              Add Item Row
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Summary & Footer */}
      <div className="p-8 bg-white">
        <div className="flex flex-col xl:flex-row justify-between gap-12">
          
          {/* Left side: Prepared By, Remarks, Words */}
          <div className="flex-1 space-y-5">
            <div>
              <label className={labelClasses}>Amount In Words</label>
              <div className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold tracking-wide text-sm">
                {amountInWords || 'ZERO AED ONLY'}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClasses}>Prepared By</label>
                <input 
                  type="text" 
                  placeholder="e.g., NASEEM" 
                  value={footerData.preparedBy} 
                  onChange={e => handleFooterChange('preparedBy', e.target.value)} 
                  className={`${baseInputClasses} uppercase`} 
                />
              </div>
              <div>
                <label className={labelClasses}>Remarks (Optional)</label>
                <input 
                  type="text" 
                  value={footerData.remarks} 
                  onChange={e => handleFooterChange('remarks', e.target.value)} 
                  className={baseInputClasses} 
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Right side: Calculations */}
          <div className="w-full xl:w-[380px] bg-slate-50/80 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-end">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Subtotal</span>
                <span className="text-base font-semibold text-slate-800">{totals.subTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">VAT (5%)</span>
                <span className="text-base font-semibold text-slate-800">{totals.vat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="pt-4 border-t border-slate-200/80 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Net Amount</span>
                <span className="text-2xl font-bold text-emerald-600">
                  AED {totals.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Action Footer */}
        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isFormValid()}
            className={`px-10 py-4 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
              isFormValid() && !isSubmitting
                ? 'bg-brand-dark text-white hover:bg-brand-light hover:-translate-y-0.5 hover:shadow-xl' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Generate & Sync LPO →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}