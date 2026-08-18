// frontend/src/components/operations/LPOItemTypeahead.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function LPOItemTypeahead({
  value,
  onChange,
  onSelect,
  inventory,
  baseInputClasses,
  parentOnKeyDown
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef(null);
  const listRef = useRef(null); 

  const cleanSearch = (value || '').trim().toLowerCase();
  const filteredInventory = inventory.filter(p =>
    (p.product_name || '').toLowerCase().includes(cleanSearch)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  const handleItemSelect = (product) => {
    onSelect(product);
    setIsOpen(false);
    
    // Auto-advance focus to the KG/QTY field in the same row
    setTimeout(() => {
      if (containerRef.current) {
        const parentRow = containerRef.current.closest('.flex');
        if (parentRow) {
          const numberInputs = parentRow.querySelectorAll('input[type="number"]');
          if (numberInputs && numberInputs.length > 0) {
            numberInputs[0].focus();
            numberInputs[0].select();
          }
        }
      }
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (isOpen && filteredInventory.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredInventory.length - 1 ? prev + 1 : prev));
        return; 
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (activeIndex >= 0 && filteredInventory[activeIndex]) {
          e.preventDefault();
          handleItemSelect(filteredInventory[activeIndex]);
          return;
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
    }
    
    if (parentOnKeyDown) {
      parentOnKeyDown(e);
    }
  };

  return (
    <div className={`w-full lg:w-[30%] relative product-search-container ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
      <input
        type="text"
        placeholder="e.g., SPECIAL PARATHA"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={`${baseInputClasses} uppercase`}
      />

      {isOpen && inventory.length > 0 && (
        <div 
          ref={listRef}
          className="absolute top-[calc(100%+4px)] left-0 w-full max-h-64 overflow-y-auto bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[120] animate-in fade-in zoom-in-95 duration-200"
        >
          {filteredInventory.map((product, index) => (
            <div
              key={product.inv_id}
              onClick={() => {
                handleItemSelect(product);
              }}
              className={`p-4 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group flex justify-between items-center gap-4 ${
                activeIndex === index ? 'bg-brand-light/10 border-l-4 border-l-brand-dark' : 'hover:bg-brand-light/5 border-l-4 border-transparent'
              }`}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`text-sm font-bold uppercase truncate transition-colors ${
                  activeIndex === index ? 'text-brand-dark' : 'text-slate-800 group-hover:text-brand-dark'
                }`}>
                  {product.product_name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">
                  {product.weight} • {product.qty} IN STOCK
                </span>
              </div>
              
              {product.price > 0 && (
                <span className="shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100/50">
                  AED {product.price}
                </span>
              )}
            </div>
          ))}
          {filteredInventory.length === 0 && (
            <div className="px-4 py-6 text-sm font-medium text-slate-500 text-center italic bg-slate-50/50">
              No matching items. Type custom description.
            </div>
          )}
        </div>
      )}
    </div>
  );
}