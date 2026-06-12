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

  it('routes founder selection to a single exact label', () => {
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
      investorId: null,
    });
  });
});
