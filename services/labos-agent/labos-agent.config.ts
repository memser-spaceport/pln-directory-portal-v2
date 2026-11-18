import {
  LABOS_AGENT_API_STORAGE_KEY,
  LABOS_AGENT_ENABLED_BY_DEFAULT,
  LABOS_AGENT_GATE_STORAGE_KEY,
  LABOS_AGENT_MOCK_BY_DEFAULT,
} from './constants';

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // Private mode or blocked storage: use the defaults.
  }
}

/** The local feature gate: the code default, or `localStorage['labos-agent'] = 'on'` in this browser. */
export function isLabosAgentGateOn(): boolean {
  return LABOS_AGENT_ENABLED_BY_DEFAULT || readStorage(LABOS_AGENT_GATE_STORAGE_KEY) === 'on';
}

/** The live C1 client unless `localStorage['labos-agent-api'] = 'mock'` (or the code default says mock). */
export function isLabosAgentMock(): boolean {
  return LABOS_AGENT_MOCK_BY_DEFAULT || readStorage(LABOS_AGENT_API_STORAGE_KEY) === 'mock';
}
