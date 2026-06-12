import type { UnifiedSelection } from './UnifiedSearchSelect';

export const CLEAR_CONNECTOR_LENS = {
  wi_connector: null,
  wi_connector_labels: null,
  wi_connector_contains: null,
} as const;

export function selectionToConnectorFilter(sel: UnifiedSelection) {
  return {
    wi_connector: sel.displayLabel,
    wi_connector_labels: sel.matchLabels,
    wi_connector_contains: sel.containsLabels ?? [],
    investorId: null,
  };
}
