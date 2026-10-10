import { useState, useEffect, useRef, useCallback } from 'react';

const DRAFT_PREFIX = 'apex_draft_';

/**
 * Custom hook for local offline draft persistence in forms.
 * @param {string} formKey Unique identifier for the form (e.g. 'contractor_dpr_123', 'distributor_delivery')
 * @param {object} formData Current form state to persist
 * @param {boolean} isModalOpen Whether the form/modal is active
 * @param {number} debounceMs Delay before saving to localStorage
 */
export function useOfflineDraft(formKey, formData, isModalOpen = true, debounceMs = 600) {
  const fullKey = `${DRAFT_PREFIX}${formKey}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  // Check on mount or when key/modal changes
  useEffect(() => {
    if (!formKey) return;
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          setHasDraft(true);
          setDraftData(parsed.data);
          setLastSaved(parsed.timestamp ? new Date(parsed.timestamp) : null);
        }
      } else {
        setHasDraft(false);
        setDraftData(null);
        setLastSaved(null);
      }
    } catch (e) {
      console.error('Failed to read offline draft:', e);
    }
  }, [fullKey, isModalOpen]);

  // Debounced auto-save
  useEffect(() => {
    if (!isModalOpen || !formKey) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        if (formData && Object.keys(formData).length > 0) {
          const now = new Date();
          const payload = {
            data: formData,
            timestamp: now.toISOString()
          };
          localStorage.setItem(fullKey, JSON.stringify(payload));
          setLastSaved(now);
          setHasDraft(true);
          setDraftData(formData);
        }
      } catch (e) {
        console.warn('Failed to auto-save offline draft:', e);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [formData, fullKey, isModalOpen, debounceMs]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(fullKey);
      setHasDraft(false);
      setDraftData(null);
      setLastSaved(null);
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  }, [fullKey]);

  return {
    hasDraft,
    draftData,
    lastSaved,
    clearDraft
  };
}

export default useOfflineDraft;
