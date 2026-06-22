import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // 1. Listen for Internet connection changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue(); // Internet is back! Try to sync.
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run once on startup (in case they opened the app with internet after being offline)
    processOfflineQueue(); 
    updateQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Add Payload to Offline Queue
  const queuePayload = (payload) => {
    const currentQueue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
    currentQueue.push(payload);
    localStorage.setItem('offline_sync_queue', JSON.stringify(currentQueue));
    updateQueueCount();
  };

  const updateQueueCount = () => {
    const currentQueue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
    setQueueCount(currentQueue.length);
  };

  // 3. Process the Queue invisibly in the background
  const processOfflineQueue = async () => {
    if (!navigator.onLine || isSyncing) return;

    const currentQueue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    let remainingQueue = [...currentQueue];

    console.log(`Starting background sync for ${currentQueue.length} items...`);

    for (let i = 0; i < currentQueue.length; i++) {
      const payload = currentQueue[i];
      try {
        // Send to your backend
        const response = await api.post('/api/inflow/complete-session', payload);
        
        if (response.data.success) {
           console.log(`✅ Synced offline session: ${payload.clientSessionId}`);
           // Remove from queue upon success
           remainingQueue = remainingQueue.filter(item => item.clientSessionId !== payload.clientSessionId);
           localStorage.setItem('offline_sync_queue', JSON.stringify(remainingQueue));
           updateQueueCount();
        }
      } catch (error) {
        console.error(`❌ Failed to sync session: ${payload.clientSessionId}`, error);
        // If it fails (server error), leave it in the queue to try again later
        break; 
      }
    }

    setIsSyncing(false);
  };

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, queueCount, queuePayload, processOfflineQueue }}>
      {children}
    </SyncContext.Provider>
  );
};