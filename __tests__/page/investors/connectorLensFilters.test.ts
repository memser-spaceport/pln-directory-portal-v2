import { selectionToConnectorFilter } from '@/components/page/investors/WarmIntrosWorkspace/connectorLensFilters';

describe('selectionToConnectorFilter', () => {
  it('routes investor selection to person connector labels only', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'investor',
        displayLabel: 'Jane Doe',
        matchLabels: ['Jane Doe'],
      }),
    ).toEqual({
      wi_connector: 'Jane Doe',
      wi_connector_labels: ['Jane Doe'],
      wi_connector_contains: [],
      wi_connector_kind: 'person',
      investorId: null,
    });
  });

  it('does not pack firm contains for investor person selection', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'investor',
        displayLabel: 'Josh Baer',
        matchLabels: ['Josh Baer'],
      }),
    ).toEqual({
      wi_connector: 'Josh Baer',
      wi_connector_labels: ['Josh Baer'],
      wi_connector_contains: [],
      wi_connector_kind: 'person',
      investorId: null,
    });
  });

  it('routes fund selection to org connector labels', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'fund',
        displayLabel: 'Coinbase',
        matchLabels: ['Coinbase'],
        containsLabels: ['Coinbase'],
      }),
    ).toEqual({
      wi_connector: 'Coinbase',
      wi_connector_labels: ['Coinbase'],
      wi_connector_contains: ['Coinbase'],
      wi_connector_kind: 'org',
      investorId: null,
    });
  });

  it('routes team selection to org labels without founder names', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'team',
        displayLabel: 'Modular Globe',
        matchLabels: ['Modular Globe'],
        containsLabels: ['Modular Globe'],
      }),
    ).toEqual({
      wi_connector: 'Modular Globe',
      wi_connector_labels: ['Modular Globe'],
      wi_connector_contains: ['Modular Globe'],
      wi_connector_kind: 'org',
      investorId: null,
    });
  });

  it('routes founder selection to person labels only', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'founder',
        displayLabel: 'Alice Founder',
        matchLabels: ['Alice Founder'],
      }),
    ).toEqual({
      wi_connector: 'Alice Founder',
      wi_connector_labels: ['Alice Founder'],
      wi_connector_contains: [],
      wi_connector_kind: 'person',
      investorId: null,
    });
  });

  it('routes a PL team member selection to an exact-name person connector label', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'pl_team',
        displayLabel: 'Brad Holden',
        matchLabels: ['Brad Holden'],
      }),
    ).toEqual({
      wi_connector: 'Brad Holden',
      wi_connector_labels: ['Brad Holden'],
      wi_connector_contains: [],
      wi_connector_kind: 'person',
      investorId: null,
    });
  });
});
