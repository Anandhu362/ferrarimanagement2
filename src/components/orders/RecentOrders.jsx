// frontend/src/components/orders/RecentOrders.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../config/api'; 

export default function RecentOrders({ refreshTrigger }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeBranch = localStorage.getItem('active_branch');
      if (!activeBranch) return;
      const response = await api.get(`/api/orders/recent?branchId=${encodeURIComponent(activeBranch)}&limit=5`);
      
      if (response.data && response.data.success) {
        setOrders(response.data.data);
      } else {
        setError("Failed to load orders from the database.");
      }

    } catch (error) {
      console.error("Error fetching recent orders:", error);
      setError("Connection error. Could not fetch recent orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [refreshTrigger]);

  // ✅ VISUAL BATCHING LOGIC: Group recent orders by Order ID
  const groupedOrders = useMemo(() => {
    const groupsMap = new Map();
    orders.forEach(order => {
      if (!groupsMap.has(order.id)) {
        groupsMap.set(order.id, {
          id: order.id,
          companyName: order.companyName,
          date: order.date,
          deliveryDate: order.deliveryDate,
          items: []
        });
      }
      groupsMap.get(order.id).items.push(order);
    });
    return Array.from(groupsMap.values());
  }, [orders]);

  const getStatusBadge = (status) => {
    if (status === 'CONFIRMED') return 'bg-amber-50 text-amber-600 border-amber-200/50';
    if (status === 'DISPATCHED') return 'bg-blue-50 text-blue-600 border-blue-200/50';
    if (status === 'DELIVERED') return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
    return 'bg-slate-50 text-slate-500 border-slate-200/50';
  };

  // Helper to format the delivery date nicely
  const formatDeliveryDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-white rounded-[2rem] border border-slate-200/60 shadow-sm mt-8">
         <span className="text-slate-400 font-medium animate-pulse">Loading recent orders...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden mt-8 relative z-10">
      <div className="p-6 border-b border-slate-100/80 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Recent Orders</h3>
          <p className="text-xs text-slate-400 mt-1">The last 5 orders successfully pushed to the system.</p>
        </div>
        <button 
          onClick={fetchRecentOrders}
          className="text-sm font-medium text-slate-500 hover:text-brand-dark bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50/50">
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Client & Dates</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4 text-center">Weight</th>
              <th className="px-6 py-4 text-center">Qty</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-sm">
            {error ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-rose-500 font-medium bg-rose-50/30">
                  {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium">No recent orders found.</td>
              </tr>
            ) : (
              /* ✅ Map through grouped orders first */
              groupedOrders.map((group) => (
                <React.Fragment key={group.id}>
                  {/* ✅ Map through individual items within the group */}
                  {group.items.map((order, index) => {
                    const isFirstInGroup = index === 0;

                    return (
                      <tr key={`${order.id}-${index}`} className="hover:bg-slate-50/50 transition-colors group/row">
                        
                        {/* Merged Columns: Only render on the FIRST item and span downward */}
                        {isFirstInGroup && (
                          <td rowSpan={group.items.length} className="px-6 py-4 align-top bg-white border-r border-slate-50">
                            <span className="font-semibold text-slate-900 tracking-tight">{order.id || '—'}</span>
                          </td>
                        )}
                        
                        {isFirstInGroup && (
                          <td rowSpan={group.items.length} className="px-6 py-4 align-top bg-white border-r border-slate-50">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">{order.companyName || '—'}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400" title="Order Date">Ord: {order.date || '—'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                <span className="text-[10px] font-medium text-brand-dark" title="Delivery Date">Del: {formatDeliveryDate(order.deliveryDate)}</span>
                              </div>
                            </div>
                          </td>
                        )}
                        
                        {/* Standard Columns: Always render for every product */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-light shrink-0"></span>
                            <span className="font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{order.product || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-semibold">{order.weight || '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">{order.qty || 0}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-bold tracking-wide uppercase border ${getStatusBadge(order.status)}`}>
                              {order.status || 'UNKNOWN'}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}