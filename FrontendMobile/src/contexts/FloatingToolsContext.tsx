import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { AdminToolAction } from '../components/admin/AdminFloatingTools';

type FloatingToolsState = {
  actions: AdminToolAction[];
  visible: boolean;
};

type FloatingToolsDispatch = {
  setActions: (actions: AdminToolAction[]) => void;
  setVisible: (visible: boolean) => void;
};

const FloatingToolsStateContext = createContext<FloatingToolsState>({
  actions: [],
  visible: true,
});

const FloatingToolsDispatchContext = createContext<FloatingToolsDispatch>({
  setActions: () => {},
  setVisible: () => {},
});

export function FloatingToolsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FloatingToolsState>({ actions: [], visible: true });

  const dispatch = useMemo(
    () => ({
      setActions: (actions: AdminToolAction[]) =>
        setState((prev) => ({ ...prev, actions })),
      setVisible: (visible: boolean) =>
        setState((prev) => ({ ...prev, visible })),
    }),
    []
  );

  return (
    <FloatingToolsDispatchContext.Provider value={dispatch}>
      <FloatingToolsStateContext.Provider value={state}>
        {children}
      </FloatingToolsStateContext.Provider>
    </FloatingToolsDispatchContext.Provider>
  );
}

export function useFloatingToolsState() {
  return useContext(FloatingToolsStateContext);
}

export function useFloatingToolsDispatch() {
  return useContext(FloatingToolsDispatchContext);
}
