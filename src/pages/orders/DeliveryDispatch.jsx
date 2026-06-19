// frontend/src/pages/orders/DeliveryDispatch.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import PremiumCalendar from '../../components/shared/PremiumCalendar';
import SplitItemModal from '../../components/orders/dispatch/SplitItemModal';
import DispatchHistoryTable from '../../components/orders/dispatch/DispatchHistoryTable';

export default function DeliveryDispatch() {
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    capacity: ''
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [trips, setTrips] = useState([{ id: 1, name: 'Trip 1', orders: [], currentLoad: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [editingTripId, setEditingTripId] = useState(null);

  // NEW: State for Split Modal & History Refresh
  const [splitConfig, setSplitConfig] = useState({ isOpen: false, item: null, sourceId: null, destId: null, availableCapacity: 0, tripName: '' });
  const [refreshHistoryTick, setRefreshHistoryTick] = useState(0);

  // Fetch locations dynamically based on the selected date
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get(`/api/orders/delivery-locations?date=${filters.date}`);
        if (res.data.success) {
          // Allow 'ALL' to bypass strict location filters as updated in the backend
          const locations = ['ALL', ...res.data.locations];
          setAvailableLocations(locations);
          if (locations.length > 0 && !filters.location) {
            setFilters(prev => ({ ...prev, location: locations[0] }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch locations", error);
      }
    };
    fetchLocations();
  }, [filters.date]);

  // Fetch individual products/items when date or location changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!filters.location) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/api/orders/dispatch/orders?date=${filters.date}&location=${filters.location}`);
        if (res.data.success) {
          setUnassignedOrders(res.data.data);
          setTrips([{ id: 1, name: 'Trip 1', orders: [], currentLoad: 0 }]);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [filters.date, filters.location]);

  // --- AUTO SORTING ALGORITHM (Bin Packing) ---
  const handleAutoSort = () => {
    const sortedOrders = [...unassignedOrders].sort((a, b) => b.totalQty - a.totalQty);
    let newTrips = [{ id: 1, name: 'Trip 1', orders: [], currentLoad: 0 }];

    sortedOrders.forEach(order => {
      let placed = false;
      for (let trip of newTrips) {
        if (trip.currentLoad + order.totalQty <= parseInt(filters.capacity || '0', 10)) {
          trip.orders.push(order);
          trip.currentLoad += order.totalQty;
          placed = true;
          break;
        }
      }
      if (!placed) {
        newTrips.push({
          id: newTrips.length + 1,
          name: `Trip ${newTrips.length + 1}`,
          orders: [order],
          currentLoad: order.totalQty
        });
      }
    });

    setTrips(newTrips);
    setUnassignedOrders([]);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, orderId, sourceId) => {
    e.dataTransfer.setData('orderId', orderId);
    e.dataTransfer.setData('sourceId', sourceId);
  };

  const handleDrop = (e, destinationId) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const sourceId = e.dataTransfer.getData('sourceId');

    if (sourceId === destinationId) return;

    // 1. Locate the item being dragged
    let movedOrder;
    if (sourceId === 'unassigned') {
      movedOrder = unassignedOrders.find(o => o.id === orderId);
    } else {
      const sourceTrip = trips.find(t => `trip-${t.id}` === sourceId);
      movedOrder = sourceTrip?.orders.find(o => o.id === orderId);
    }

    if (!movedOrder) return;

    // 2. Capacity & Split Check (Only when moving into a trip)
    if (destinationId.startsWith('trip-')) {
      const destTripId = parseInt(destinationId.replace('trip-', ''), 10);
      const destinationTrip = trips.find(t => t.id === destTripId);
      const capacityNum = parseInt(filters.capacity || '0', 10);
      const availableSpace = capacityNum - destinationTrip.currentLoad;

      if (movedOrder.totalQty > availableSpace && availableSpace > 0) {
        // Intercept drop: Open Split Modal
        setSplitConfig({
          isOpen: true,
          item: movedOrder,
          sourceId: sourceId,
          destId: destinationId,
          availableCapacity: availableSpace,
          tripName: destinationTrip.name
        });
        return;
      } else if (availableSpace <= 0) {
        alert("This vehicle is already at or beyond maximum capacity!");
        return;
      }
    }

    // 3. Execute standard move if no split required
    executeMove(movedOrder, sourceId, destinationId);
  };

  // --- CORE MOVE LOGIC (Handles Full & Partial Splits) ---
  const executeMove = (movedItem, sourceId, destinationId, splitQty = null) => {
    let updatedUnassigned = [...unassignedOrders];
    let updatedTrips = trips.map(t => ({ ...t, orders: [...t.orders] }));

    const isSplit = splitQty !== null && splitQty < movedItem.totalQty;
    
    // Create cloned items if splitting
    const itemToMove = isSplit ? { ...movedItem, id: `${movedItem.id}-split-${Date.now()}`, totalQty: splitQty } : movedItem;
    const remainingItem = isSplit ? { ...movedItem, totalQty: movedItem.totalQty - splitQty } : null;

    // REMOVE logic
    if (sourceId === 'unassigned') {
      const idx = updatedUnassigned.findIndex(o => o.id === movedItem.id);
      if (idx > -1) {
        if (isSplit) updatedUnassigned[idx] = remainingItem;
        else updatedUnassigned.splice(idx, 1);
      }
    } else {
      const tripIdx = updatedTrips.findIndex(t => `trip-${t.id}` === sourceId);
      if (tripIdx > -1) {
        const idx = updatedTrips[tripIdx].orders.findIndex(o => o.id === movedItem.id);
        if (idx > -1) {
          if (isSplit) updatedTrips[tripIdx].orders[idx] = remainingItem;
          else updatedTrips[tripIdx].orders.splice(idx, 1);
          
          updatedTrips[tripIdx].currentLoad -= itemToMove.totalQty;
        }
      }
    }

    // ADD logic
    if (destinationId === 'unassigned') {
      updatedUnassigned.push(itemToMove);
    } else {
      const tripIdx = updatedTrips.findIndex(t => `trip-${t.id}` === destinationId);
      if (tripIdx > -1) {
        updatedTrips[tripIdx].orders.push(itemToMove);
        updatedTrips[tripIdx].currentLoad += itemToMove.totalQty;
      }
    }

    setUnassignedOrders(updatedUnassigned);
    setTrips(updatedTrips);
  };

  const addNewTrip = () => {
    setTrips([...trips, { id: trips.length + 1, name: `Trip ${trips.length + 1}`, orders: [], currentLoad: 0 }]);
  };

  // --- NEW: DISPATCH TRIP TO DATABASE ---
  const handleDispatchTrip = async (trip) => {
    if (trip.orders.length === 0) return;
    
    // Ask for quick confirmation
    if(!window.confirm(`Are you sure you want to officially dispatch ${trip.name}? This will deduct quantities from the master ledger.`)) return;

    try {
      const payload = {
        tripName: trip.name,
        date: filters.date,
        location: filters.location,
        vehicleLimit: filters.capacity,
        currentLoad: trip.currentLoad,
        items: trip.orders.map(o => ({
            orderId: o.orderId,
            companyName: o.company_name,
            product: o.product,
            inventory_id: o.inventory_id,
            qtyLoaded: o.totalQty 
        }))
      };

      const res = await api.post('/api/orders/dispatch/save-trip', payload);
      
      if (res.data.success) {
        // Remove the dispatched trip from the active board
        setTrips(trips.filter(t => t.id !== trip.id));
        // Force the history table to fetch fresh data
        setRefreshHistoryTick(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to dispatch trip", error);
      alert(error.response?.data?.message || "Error dispatching trip.");
    }
  };

  const exportSingleTripSheet = async (trip) => {
    if (trip.orders.length === 0) return;

    try {
      const response = await api.post('/api/orders/dispatch/export',
        {
          date: filters.date,
          location: filters.location,
          trips: [trip], 
          tripName: trip.name 
        },
        { responseType: 'blob' }
      );

      const safeTripName = trip.name.replace(/[^a-zA-Z0-9]/g, '_');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dispatch_${safeTripName}_${filters.date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const scrollbarClasses = "overflow-y-auto flex flex-col gap-3 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full";

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative">

      {/* Header section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[1.75rem] font-semibold text-slate-900 tracking-tight leading-tight">Delivery Routing</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-light tracking-wide">
            Organize, split capacities, and dispatch orders into tracked vehicles.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-brand-dark rounded-[2rem] p-8 text-white flex flex-col sm:flex-row items-center gap-6 relative shadow-[0_12px_40px_rgb(43,38,64,0.3)] mb-8">
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 relative z-20 w-full">
          <label className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2 block">Dispatch Date</label>
          <div
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsLocationDropdownOpen(false);
            }}
            className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer flex justify-between items-center focus:outline-none hover:border-brand-light transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span>{filters.date ? new Date(filters.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}</span>
            </div>
          </div>

          <PremiumCalendar
            selectedDate={filters.date}
            onDateSelect={(newDate) => {
              if (newDate) setFilters({ ...filters, date: newDate });
              setIsCalendarOpen(false);
            }}
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>

        <div className="flex-1 relative z-20 w-full">
          <label className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2 block">Location Filter</label>
          <div
            onClick={() => {
              setIsLocationDropdownOpen(!isLocationDropdownOpen);
              setIsCalendarOpen(false);
            }}
            className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer flex justify-between items-center focus:outline-none hover:border-brand-light transition-colors"
          >
            <span className="truncate">{filters.location || 'Select Location...'}</span>
            <svg className={`w-5 h-5 transition-transform duration-300 text-white/50 ${isLocationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isLocationDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[40]" onClick={() => setIsLocationDropdownOpen(false)}></div>
              <div className="absolute top-[calc(100%+8px)] left-0 w-full p-2 bg-brand-dark rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/20 z-[50] animate-in slide-in-from-top-2 fade-in duration-200">
                {availableLocations.length === 0 ? (
                  <div className="px-4 py-3 text-white/50 text-sm">No locations available</div>
                ) : (
                  availableLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => {
                        setFilters({ ...filters, location: loc });
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${filters.location === loc
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      {loc === 'ALL' ? '🌍 All Locations (Mixed)' : loc}
                      {filters.location === loc && (
                        <svg className="w-4 h-4 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 relative z-10 w-full">
          <label className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-2 block">Vehicle Limit (Bags)</label>
          <div className="relative">
            <input
              type="text"
              value={filters.capacity}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setFilters({ ...filters, capacity: val });
              }}
              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-brand-light transition-colors pl-12"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 w-full sm:w-auto">
          <button
            onClick={handleAutoSort}
            disabled={unassignedOrders.length === 0 || !filters.capacity}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-dark rounded-xl font-bold shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            Auto-Sort
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-light/30 border-t-brand-light rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* UNASSIGNED QUEUE */}
            <div
              className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-200 shadow-inner h-[650px] overflow-hidden flex flex-col"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, 'unassigned')}
            >
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 shrink-0">
                <h3 className="text-sm font-bold text-slate-900 tracking-widest uppercase">Pending Queue</h3>
                <span className="bg-brand-dark text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {unassignedOrders.length}
                </span>
              </div>

              <div className={`flex-1 ${scrollbarClasses}`}>
                {unassignedOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <p className="text-sm font-medium">All items assigned</p>
                  </div>
                ) : (
                  unassignedOrders.map(order => (
                    <OrderCard key={order.id} order={order} onDragStart={handleDragStart} sourceId="unassigned" />
                  ))
                )}
              </div>
            </div>

            {/* TRIPS COLUMNS */}
            <div className="lg:col-span-3 flex gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {trips.map(trip => {
                const capacityNum = parseInt(filters.capacity || '0', 10);
                const isOverloaded = trip.currentLoad > capacityNum && capacityNum > 0;
                const loadPercentage = capacityNum > 0 ? Math.min(100, (trip.currentLoad / capacityNum) * 100) : 100;

                return (
                  <div
                    key={trip.id}
                    className={`min-w-[340px] bg-white rounded-[2rem] p-6 border shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[650px] flex flex-col transition-colors ${isOverloaded ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, `trip-${trip.id}`)}
                  >
                    <div className="mb-5 pb-4 border-b border-slate-100 shrink-0">
                      <div className="flex justify-between items-start mb-3">

                        {/* EDITABLE TRIP TITLE */}
                        {editingTripId === trip.id ? (
                          <input
                            type="text"
                            defaultValue={trip.name}
                            autoFocus
                            onBlur={(e) => {
                              const newName = e.target.value.trim() || `Trip ${trip.id}`;
                              setTrips(trips.map(t => t.id === trip.id ? { ...t, name: newName } : t));
                              setEditingTripId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            className="text-lg font-bold text-slate-900 border-b-2 border-brand-light focus:outline-none bg-transparent w-full mr-2"
                          />
                        ) : (
                          <h3
                            className="text-lg font-bold text-slate-900 cursor-pointer hover:text-brand-light transition-colors flex items-center gap-2 group"
                            onClick={() => setEditingTripId(trip.id)}
                            title="Click to rename trip"
                          >
                            {trip.name}
                            <svg className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </h3>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Export Trip Button */}
                          <button
                            onClick={() => exportSingleTripSheet(trip)}
                            disabled={trip.orders.length === 0}
                            title="Download Trip Manifest"
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </button>

                          {/* Confirm & Dispatch Trip Button */}
                          <button
                            onClick={() => handleDispatchTrip(trip)}
                            disabled={trip.orders.length === 0 || isOverloaded}
                            title="Confirm & Dispatch Vehicle"
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${trip.orders.length > 0 && !isOverloaded ? 'bg-brand-light text-white shadow-md hover:bg-[#5244e0]' : 'bg-slate-100 text-slate-400'}`}
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className={isOverloaded ? 'text-rose-600' : 'text-slate-500'}>Load: {trip.currentLoad}</span>
                          <span className="text-slate-400">Max: {filters.capacity || '∞'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverloaded ? 'bg-rose-500' : trip.currentLoad === capacityNum && capacityNum > 0 ? 'bg-emerald-500' : 'bg-brand-light'}`}
                            style={{ width: `${loadPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className={`flex-1 ${scrollbarClasses}`}>
                      {trip.orders.map(order => (
                        <OrderCard key={order.id} order={order} onDragStart={handleDragStart} sourceId={`trip-${trip.id}`} />
                      ))}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addNewTrip}
                className="min-w-[340px] rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-brand-light/50 bg-slate-50/30 hover:bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-brand-light transition-all h-[650px] group shrink-0"
              >
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <span className="font-semibold tracking-wide">Add Vehicle Trip</span>
              </button>

            </div>
          </div>
          
          {/* History / Ledger Section */}
          <DispatchHistoryTable key={refreshHistoryTick} />
        </>
      )}

      {/* Mounting the Split Modal */}
      <SplitItemModal 
        isOpen={splitConfig.isOpen}
        item={splitConfig.item}
        tripName={splitConfig.tripName}
        availableCapacity={splitConfig.availableCapacity}
        onClose={() => setSplitConfig({ ...splitConfig, isOpen: false })}
        onConfirm={(splitQty) => {
          setSplitConfig({ ...splitConfig, isOpen: false });
          executeMove(splitConfig.item, splitConfig.sourceId, splitConfig.destId, splitQty);
        }}
      />

    </div>
  );
}

// Sub-component tailored to the new Product/Item structure
function OrderCard({ order, onDragStart, sourceId }) {
  // Use orderId as primary display, fallback to item id
  const displayId = (order.orderId || order.id).split('-').pop();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order.id, sourceId)}
      className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-brand-light/40 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col min-h-fit"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-light/20 group-hover:bg-brand-light transition-colors"></div>

      <div className="flex justify-between items-start mb-2 pl-2 w-full">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">#{displayId}</span>
        {order.delivery_location && (
          <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded truncate max-w-[100px]">
             {order.delivery_location}
          </span>
        )}
      </div>

      <h4 className="text-[13px] leading-snug font-bold text-slate-900 mb-1 pl-2 break-words w-full pr-2" title={order.company_name}>
        {order.company_name}
      </h4>
      
      <p className="text-xs text-slate-500 pl-2 mb-4">
        {order.product} <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded ml-1">{order.weight}</span>
      </p>

      <div className="flex justify-between items-end mt-auto pt-3 border-t border-slate-50 pl-2 w-full">
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">{order.phone_number}</span>
        <div className="bg-brand-bg text-brand-dark px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-brand-light/10 shrink-0">
          {order.totalQty} <span className="text-[10px] font-medium opacity-70">Bags</span>
        </div>
      </div>
    </div>
  );
}