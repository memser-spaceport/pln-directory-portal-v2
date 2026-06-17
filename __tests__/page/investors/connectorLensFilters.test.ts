import { selectionToConnectorFilter } from '@/components/page/investors/WarmIntrosWorkspace/connectorLensFilters';

describe('selectionToConnectorFilter', () => {
  it('routes investor selection to connector lens labels, not investorId', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'investor',
        displayLabel: 'Jane Doe',
        matchLabels: ['Jane Doe', 'Acme Ventures'],
      }),
    ).toEqual({
      wi_connector: 'Jane Doe',
      wi_connector_labels: ['Jane Doe', 'Acme Ventures'],
      wi_connector_contains: [],
      investorId: null,
    });
  });

  it('includes contains labels for investor firm matching', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'investor',
        displayLabel: 'Josh Baer',
        matchLabels: ['Josh Baer', 'Capital Factory'],
        containsLabels: ['Capital Factory'],
      }),
    ).toEqual({
      wi_connector: 'Josh Baer',
      wi_connector_labels: ['Josh Baer', 'Capital Factory'],
      wi_connector_contains: ['Capital Factory'],
      investorId: null,
    });
  });

  it('includes contains labels for team selection', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'team',
        displayLabel: 'Modular Globe',
        matchLabels: ['Modular Globe', 'Jane Park'],
        containsLabels: ['Modular Globe'],
      }),
    ).toEqual({
      wi_connector: 'Modular Globe',
      wi_connector_labels: ['Modular Globe', 'Jane Park'],
      wi_connector_contains: ['Modular Globe'],
      investorId: null,
    });
  });

  it('routes founder selection to exact and team contains labels', () => {
    expect(
      selectionToConnectorFilter({
        kind: 'founder',
        displayLabel: 'Alice Founder',
        matchLabels: ['Alice Founder', 'Modular Globe'],
        containsLabels: ['Modular Globe'],
      }),
    ).toEqual({
      wi_connector: 'Alice Founder',
      wi_connector_labels: ['Alice Founder', 'Modular Globe'],
      wi_connector_contains: ['Modular Globe'],
      investorId: null,
    });
  });

  it('routes a PL team member selection to an exact-name connector label (task 04)', () => {
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
      investorId: null,
    });
  });
});
