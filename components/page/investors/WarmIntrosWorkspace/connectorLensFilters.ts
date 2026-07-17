import type { UnifiedSelection } from './UnifiedSearchSelect';

export const CLEAR_CONNECTOR_LENS = {
  wi_connector: null,
  wi_connector_labels: null,
  wi_connector_contains: null,
  wi_connector_kind: null,
} as const;

function connectorMatchKind(kind: UnifiedSelection['kind']): 'person' | 'org' {
  return kind === 'team' || kind === 'fund' ? 'org' : 'person';
}

export function selectionToConnectorFilter(sel: UnifiedSelection) {
  return {
    wi_connector: sel.displayLabel,
    wi_connector_labels: sel.matchLabels,
    wi_connector_contains: sel.containsLabels ?? [],
    wi_connector_kind: connectorMatchKind(sel.kind),
    investorId: null,
  };
}
