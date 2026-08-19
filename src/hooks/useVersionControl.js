import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../config/firebase';
import API from '../config/api';

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const ACKNOWLEDGED_KEY = 'app_acknowledged_version';

export function useVersionControl() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [versionData, setVersionData] = useState(null);

    const applyUpdate = () => {
        if (versionData?.latestVersion) {
            localStorage.setItem(ACKNOWLEDGED_KEY, versionData.latestVersion);
        }
        window.location.reload();
    };

    useEffect(() => {
        const checkVersionState = (data) => {
            if (!data || !data.latestVersion) return;

            const ackVersion = localStorage.getItem(ACKNOWLEDGED_KEY);
            const isNewerThanApp = data.latestVersion !== CURRENT_VERSION;
            const isNotYetAcknowledged = data.latestVersion !== ackVersion;

            console.log(`[Version Control] RTDB: v${data.latestVersion} | App: v${CURRENT_VERSION} | Ack: v${ackVersion || 'none'}`);

            if (isNewerThanApp && isNotYetAcknowledged) {
                setUpdateAvailable(true);
                setVersionData(data);
            } else {
                setUpdateAvailable(false);
            }
        };

        // 1. Listen to Firebase Realtime Database node in real-time
        if (rtdb) {
            try {
                const versionRef = ref(rtdb, 'system_metadata/version');
                const unsubscribe = onValue(versionRef, (snapshot) => {
                    if (snapshot.exists()) {
                        checkVersionState(snapshot.val());
                    }
                }, (error) => {
                    console.warn('[Version Control] RTDB Listener fallback to HTTP:', error.message);
                });

                return () => unsubscribe();
            } catch (e) {
                console.warn('[Version Control] RTDB init warning:', e.message);
            }
        }

        // 2. HTTP Polling Fallback (Runs if RTDB is unavailable or every 15 mins)
        const checkVersionHTTP = async () => {
            try {
                const res = await API.get('/api/system/version');
                if (res.data?.success && res.data.data) {
                    checkVersionState(res.data.data);
                }
            } catch (e) {
                // Silently ignore HTTP check errors
            }
        };

        checkVersionHTTP();
        const interval = setInterval(checkVersionHTTP, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // 3. Catch dynamic import chunk loading errors (Stale builds navigation handling)
    useEffect(() => {
        const handleChunkError = (event) => {
            if (event?.message && /loading chunk|dynamically imported module|failed to fetch/i.test(event.message)) {
                console.warn('[Version Control] Stale JS chunk detected during navigation. Triggering smooth reload...');
                window.location.reload();
            }
        };
        window.addEventListener('error', handleChunkError);
        return () => window.removeEventListener('error', handleChunkError);
    }, []);

    // 4. Idle Auto-Apply Logic
    // Automatically applies update if user is idle for > 5 minutes with no active typing in input fields
    useEffect(() => {
        if (!updateAvailable) return;

        let lastActivityTime = Date.now();

        const resetTimer = () => {
            lastActivityTime = Date.now();
        };

        const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
        activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

        const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 Minutes Idle Threshold

        const idleCheckInterval = setInterval(() => {
            const idleTime = Date.now() - lastActivityTime;
            
            // If user has been idle for > 5 minutes
            if (idleTime >= IDLE_THRESHOLD_MS) {
                // Check if user is currently focused or typing in an input, textarea or select element
                const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
                const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

                if (!isTyping) {
                    console.log('[Version Control] User idle for 5+ mins with no active input typing. Auto-applying update...');
                    applyUpdate();
                }
            }
        }, 10000); // Check every 10 seconds

        return () => {
            activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
            clearInterval(idleCheckInterval);
        };
    }, [updateAvailable, versionData]);

    return { 
        updateAvailable, 
        versionData, 
        currentVersion: CURRENT_VERSION,
        applyUpdate
    };
}
