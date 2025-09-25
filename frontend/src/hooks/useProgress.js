import { useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';

// Placeholder - implement getCurrentUserId integration as needed
function getCurrentUserId() {
  try {
    if (typeof window !== 'undefined' && window.__CURRENT_USER_ID__) return window.__CURRENT_USER_ID__;
  } catch (e) {}
  return '';
}

export const useProgress = () => {
  const pendingRequests = useRef(new Set());
  const abortControllers = useRef(new Map());

  const updateProgress = useCallback(async (progressData) => {
    const key = `${progressData.topic}_${progressData.date}_${progressData.status}`;

    if (pendingRequests.current.has(key)) {
      return;
    }

    if (abortControllers.current.has(key)) {
      abortControllers.current.get(key).abort();
    }

    const abortController = new AbortController();
    abortControllers.current.set(key, abortController);
    pendingRequests.current.add(key);

    try {
      const response = await fetch('/api/resources/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': getCurrentUserId()
        },
        body: JSON.stringify({ sessions: [progressData] }),
        signal: abortController.signal
      });

      return response.json();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Progress update failed:', error);
      }
      throw error;
    } finally {
      pendingRequests.current.delete(key);
      abortControllers.current.delete(key);
    }
  }, []);

  const debouncedUpdateProgress = useMemo(
    () => debounce(updateProgress, 500, { maxWait: 2000 }),
    [updateProgress]
  );

  return { updateProgress: debouncedUpdateProgress };
};
