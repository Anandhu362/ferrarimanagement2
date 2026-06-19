import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'; 

// 1. ORIGINAL FUNCTION: fetchWithCache 
// (Restored so any other components using it don't break)
export const fetchWithCache = async (key, fetchFunction, ttlHours = 24) => {
  const cachedItem = localStorage.getItem(key);
  const now = new Date().getTime();

  if (cachedItem) {
    try {
      const { data, timestamp } = JSON.parse(cachedItem);
      if (now - timestamp < ttlHours * 60 * 60 * 1000) {
        return data;
      }
    } catch (e) {
      console.warn(`Cache parsing failed for ${key}. Fetching fresh.`);
    }
  }

  try {
    const freshData = await fetchFunction();
    localStorage.setItem(key, JSON.stringify({ data: freshData, timestamp: now }));
    return freshData;
  } catch (error) {
    console.error(`Error fetching data for ${key}:`, error);
    throw error;
  }
};

// 2. RESTORED FUNCTION: clearCache 
// (This fixes the white screen error on the InventoryForm page)
export const clearCache = (key) => {
  if (key) {
    localStorage.removeItem(key);
  } else {
    localStorage.clear();
  }
};

// 3. NEW FUNCTION: getCachedCustomers 
// (Used for the new Agent Dashboard dropdown)
export const getCachedCustomers = async () => {
  const CACHE_KEY = 'ferrari_customers_cache';
  const TTL_HOURS = 24;
  const cachedItem = localStorage.getItem(CACHE_KEY);
  const now = new Date().getTime();

  // Check Local Storage First
  if (cachedItem) {
    try {
      const { data, timestamp } = JSON.parse(cachedItem);
      // Check if cache is still valid
      if (now - timestamp < TTL_HOURS * 60 * 60 * 1000) {
        console.log('⚡ Serving Customers from Local Cache');
        return data; 
      }
    } catch (e) {
      console.warn('Customer cache parsing failed. Fetching fresh from Firebase.');
    }
  }

  // Fallback: Fetch from Firebase Firestore
  try {
    console.log('🌐 Fetching Customers from Firebase...');
    const snapshot = await getDocs(collection(db, 'customers'));
    const customersList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Save to Local Storage
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: customersList,
      timestamp: now
    }));

    return customersList;
  } catch (error) {
    console.error("Error fetching customers from Firebase:", error);
    return []; // Return empty array on failure so app doesn't crash
  }
};