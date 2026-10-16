import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { KpiScheduleTable } from '@/components/page/aligement-assets/faqs/faqs';

describe('FAQ KPI emissions schedule', () => {
  it('lists the live weights with their totals', () => {
    render(
      <KpiScheduleTable
        rows={[
          { category: 'Network Tooling', weight: 1.2, percentOfTotal: 60, emissionsPerSnapshot: 6000 },
          { category: 'Projects', weight: 0.8, percentOfTotal: 40, emissionsPerSnapshot: 4000 },
        ]}
      />,
    );

    expect(screen.getByText('Network Tooling')).toBeInTheDocument();
    expect(screen.getByText('60.00%')).toBeInTheDocument();
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it.each([[undefined], [[]]])('says the schedule is unavailable without weights: %j', (rows) => {
    render(<KpiScheduleTable rows={rows} />);

    expect(screen.getByText('The KPI emissions schedule is currently unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
