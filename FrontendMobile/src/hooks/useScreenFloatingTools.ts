import { useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useFloatingToolsDispatch } from '../contexts/FloatingToolsContext';
import type { AdminToolAction } from '../components/admin/AdminFloatingTools';

/**
 * Register floating-tool actions for the current screen.
 * Actions are set whenever the screen is focused. There is no blur cleanup
 * to avoid race conditions when switching between tabs.
 *
 * @param actions   Array of tool actions to show in the FAB
 * @param visible   Whether the FAB should be visible (default true)
 *
 * Example:
 *   useScreenFloatingTools([
 *     { key: 'analytics', icon: 'analytics-outline', label: 'Analytics', onPress: () => ... },
 *   ]);
 */
export function useScreenFloatingTools(actions: AdminToolAction[], visible = true) {
  const { setActions, setVisible: setFabVisible } = useFloatingToolsDispatch();
  const isFocused = useIsFocused();
  const hasRegisteredRef = useRef(false);

  // Update actions when focused or when actions/visible change
  useEffect(() => {
    if (isFocused) {
      setActions(actions);
      setFabVisible(visible);
      hasRegisteredRef.current = true;
    }
  }, [actions, visible, isFocused, setActions, setFabVisible]);

  // Cleanup only on unmount — and only if this screen was the one that
  // last registered actions. This prevents race conditions when switching tabs.
  useEffect(() => {
    return () => {
      if (hasRegisteredRef.current) {
        setActions([]);
        setFabVisible(true);
      }
    };
  }, [setActions, setFabVisible]);
}
