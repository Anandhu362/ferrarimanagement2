// frontend/src/pages/cash-inflow/MassInflow.jsx
import React from 'react';
import GroupEntry from '../../components/inflow/GroupEntry'; 

export default function MassInflow() {
  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-12 relative">
      {/* ✅ Batch Cash Entry is now the primary and only view on this page.
          All legacy reconciliation grid code has been removed for a cleaner architecture. */}
      <GroupEntry />
    </div>
  );
}