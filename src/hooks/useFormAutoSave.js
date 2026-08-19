import { useEffect, useState } from 'react';

const DRAFT_TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours TTL Expiry

/**
 * Custom hook for zero-data-loss form state auto-saving with TTL expiration and clean purging.
 * 
 * @param {string} draftKey - Unique identifier for the form
 * @param {object} initialValues - Initial default state of the form
 * @param {string} branchId - Active branch scope
 * @param {string} userId - Active user scope
 */
export function useFormAutoSave(draftKey, initialValues, branchId = 'global', userId = 'current') {
    const storageKey = `draft_${branchId}_${userId}_${draftKey}`;

    const [isRestored, setIsRestored] = useState(false);
    const [formData, setFormData] = useState(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return initialValues;

            const payload = JSON.parse(raw);
            const now = Date.now();

            // Auto-purge if draft is older than TTL
            if (payload.savedAt && now - payload.savedAt > DRAFT_TTL_MS) {
                console.log(`[Draft Manager] Draft ${storageKey} expired (>2h). Wiping.`);
                localStorage.removeItem(storageKey);
                return initialValues;
            }

            setIsRestored(true);
            return payload.data || initialValues;
        } catch {
            return initialValues;
        }
    });

    // Auto-save form state with 500ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData && Object.keys(formData).length > 0) {
                const payload = {
                    savedAt: Date.now(),
                    data: formData
                };
                localStorage.setItem(storageKey, JSON.stringify(payload));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [storageKey, formData]);

    // Purge draft cleanly upon submission or manual reset
    const clearDraft = () => {
        localStorage.removeItem(storageKey);
        setIsRestored(false);
        setFormData(initialValues);
    };

    return [formData, setFormData, clearDraft, isRestored];
}
