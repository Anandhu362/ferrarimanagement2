import { useState, useCallback } from 'react';
import api from '../config/api';

export default function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors on new fetch
    
    try {
      const response = await api.get('/api/vendors');
      setVendors(response.data.data || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError('Failed to load vendor data from the database. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optional: A helper for optimistic UI updates during deletion
  const removeVendorFromState = useCallback((vendor_id) => {
    setVendors((prevVendors) => prevVendors.filter(v => v.vendor_id !== vendor_id));
  }, []);

  return {
    vendors,
    isLoading,
    error,
    fetchVendors,
    removeVendorFromState
  };
}