import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalEntry = {
  id: string;
  node: React.ReactNode;
};

type ModalContextValue = {
  open: (node: React.ReactNode) => string;
  close: (id?: string) => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [stack, setStack] = useState<ModalEntry[]>([]);

  const api = useMemo<ModalContextValue>(
    () => ({
      open(node) {
        const id = Math.random().toString(36).slice(2);
        setStack((s) => [...s, { id, node }]);
        return id;
      },
      close(id) {
        setStack((s) => {
          if (!id) return s.slice(0, -1);
          const idx = s.findIndex((m) => m.id === id);
          if (idx === -1) return s;
          return [...s.slice(0, idx), ...s.slice(idx + 1)];
        });
      },
    }),
    [],
  );

  return (
    <ModalContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          {stack.map((m) => (
            <React.Fragment key={m.id}>{m.node}</React.Fragment>
          ))}
        </>,
        document.body,
      )}
    </ModalContext.Provider>
  );
};

export function useModalStack() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalStack must be used inside <ModalProvider>');
  return ctx;
}
