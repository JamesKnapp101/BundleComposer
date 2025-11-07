import { useEffect, useRef } from 'react';
import { useBlocker, type Location, type NavigateFunction } from 'react-router-dom';

export type ConfirmOnExitHandler = (
  nextLocation: Location,
  continueNavigation: () => void,
  cancelNavigation: () => void,
) => void;

/**
 * Blocks in-app navigation and asks the caller to confirm.
 */
export function useConfirmOnExit(
  navigate: NavigateFunction,
  confirmHandler: ConfirmOnExitHandler,
  defaultRoute?: string,
  bypassConfirmation?: { current: boolean },
) {
  const didConfirmRef = useRef(false);

  // Only block when we haven't just confirmed and we're not bypassing.
  const shouldBlock = !didConfirmRef.current && !(bypassConfirmation?.current ?? false);

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    const continueNavigation = () => {
      // prevent a second prompt on the immediate follow-up render
      didConfirmRef.current = true;
      if (bypassConfirmation) bypassConfirmation.current = false;

      // Let the router continue to the originally intended location.
      blocker.proceed();

      // re-arm for future blocks on the next tick
      setTimeout(() => {
        didConfirmRef.current = false;
      }, 0);
    };

    const cancelNavigation = () => {
      blocker.reset(); // stay on the current page
      if (bypassConfirmation) bypassConfirmation.current = false;
    };

    // Ask the app to confirm. Provide next location + controls.
    confirmHandler(blocker.location, continueNavigation, cancelNavigation);
  }, [blocker, confirmHandler]);

  // Optional: if you want a manual escape hatch to a default route
  // when there's no pending transition, you can expose this helper:
  useEffect(() => {
    if (!defaultRoute) return;
    if (didConfirmRef.current && blocker.state === 'unblocked') {
      navigate(defaultRoute);
    }
  }, [blocker.state, defaultRoute, navigate]);
}
