import { useEffect, useRef } from 'react';
import type { Location as RouterLocation } from 'react-router-dom';
import { createPath, useBlocker, useLocation, type NavigateFunction } from 'react-router-dom';

type ConfirmOnExitHandler = (
  to: RouterLocation,
  onConfirm: () => void,
  onCancel: () => void,
) => void | Promise<void>;

export const useConfirmOnExit = (
  navigate: NavigateFunction,
  confirmHandler: ConfirmOnExitHandler,
  defaultRoute?: string,
  bypassConfirmation?: { current: boolean },
) => {
  const didConfirmRef = useRef(false);
  const inFlightRef = useRef(false);
  const targetHrefRef = useRef<string | null>(null);
  const navKeyRef = useRef<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (navKeyRef.current && navKeyRef.current !== location.key) {
      // nav finished, so disarm the blocker
      didConfirmRef.current = false;
      inFlightRef.current = false;
      targetHrefRef.current = null;
      navKeyRef.current = null;
    }
  }, [location.key]);

  const shouldBlock = !didConfirmRef.current && !(bypassConfirmation?.current ?? false);
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (inFlightRef.current) return; // avoid prompts while a dialog is open

    inFlightRef.current = true;
    targetHrefRef.current = createPath(blocker.location);

    const continueNavigation = () => {
      didConfirmRef.current = true;
      if (bypassConfirmation) bypassConfirmation.current = true;

      const href = targetHrefRef.current || defaultRoute;

      queueMicrotask(() => {
        let proceeded = false;
        try {
          if (blocker.state === 'blocked') {
            blocker.proceed();
            proceeded = true;
            // remember the current key; once it changes, nav has committed
            navKeyRef.current = location.key;
          }
        } catch (e: any) {
          if (!String(e?.message ?? '').includes('Invalid blocker state transition')) {
            console.error(e);
          }
        }
        if (!proceeded && href) {
          navigate(href, { replace: true });
        }
      });
    };

    const cancelNavigation = () => {
      blocker.reset();
      if (bypassConfirmation) bypassConfirmation.current = false;
      inFlightRef.current = false;
    };

    try {
      const check = confirmHandler(blocker.location, continueNavigation, cancelNavigation);
      if (check && typeof (check as any).then === 'function') {
        (check as Promise<void>).catch((e) => console.error(e));
      }
    } catch (e) {
      console.error(e);
      inFlightRef.current = false; // Something blew up, reset
    }
  }, [blocker, confirmHandler, navigate, defaultRoute, bypassConfirmation, location.key]);
};
