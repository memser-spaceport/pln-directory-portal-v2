import { useEffect, useSyncExternalStore } from 'react';

import {
  clampWidth,
  LABOS_AGENT_WIDTH_DEFAULT,
  LABOS_AGENT_WIDTH_VAR,
  readStoredWidth,
  useLabosAgentWidthStore,
} from '@/services/labos-agent/labos-agent.width';

function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

const useWindowWidth = () =>
  useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 0,
  );

/**
 * LAB-3429: the slot width this window shows (the member's width, clamped to the window) and its setter. The edge
 * handle uses it. The width follows the window as it resizes; the member's choice is kept for a wider window.
 */
export function useLabosAgentWidth() {
  const preferred = useLabosAgentWidthStore((st) => st.preferred);
  const setPreferred = useLabosAgentWidthStore((st) => st.actions.setPreferred);
  const windowWidth = useWindowWidth();
  const width = windowWidth ? clampWidth(preferred ?? readStoredWidth(), windowWidth) : LABOS_AGENT_WIDTH_DEFAULT;
  return { width, windowWidth, setWidth: setPreferred };
}

/**
 * LAB-3429: writes the slot width on `<html>` (`--labos-agent-w`), so the Agent panel, the Feedback tab and the edge
 * read one number. `LabosAgentRoot` runs it while the member has the agent. Removed when they do not.
 */
export function useLabosAgentWidthVar(enabled: boolean) {
  const { width } = useLabosAgentWidth();
  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.style.setProperty(LABOS_AGENT_WIDTH_VAR, `${width}px`);
    return () => {
      root.style.removeProperty(LABOS_AGENT_WIDTH_VAR);
    };
  }, [enabled, width]);
}
