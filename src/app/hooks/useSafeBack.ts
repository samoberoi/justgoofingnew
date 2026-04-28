import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Safe back-navigation hook.
 *
 * Apple App Store rejected the app (Guideline 2.1(a)) because tapping the
 * top-left back arrow did nothing on a fresh launch. Root cause:
 * `navigate(-1)` is a no-op when there is no prior history entry (e.g. the
 * app was opened directly to a route, or the reviewer landed on the page
 * via a deep link / first launch).
 *
 * This hook returns a function that tries to go back, but always falls
 * back to a sensible parent route so the button never feels dead.
 *
 * Usage:
 *   const goBack = useSafeBack();              // falls back to '/home'
 *   const goBack = useSafeBack('/profile');    // custom fallback
 */
export const useSafeBack = (fallback: string = '/home') => {
  const navigate = useNavigate();
  return useCallback(() => {
    // window.history.length is unreliable in Capacitor WKWebView (often 1
    // even after navigating). The most reliable signal we have is whether
    // we entered the app fresh on this route.
    const idx = (window.history.state && (window.history.state as any).idx) ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
};

export default useSafeBack;
