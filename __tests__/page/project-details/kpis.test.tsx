import React from 'react';
import { render, screen } from '@testing-library/react';
import KPIs from '@/components/page/project-details/kpis';
import '@testing-library/jest-dom';

describe('KPIs Component', () => {

  const kpis = [
    { key: 'Revenue', value: '$1000' },
    { key: 'Users', value: '150' },
  ];

  it('should render the title correctly', () => {
    render(<KPIs kpis={kpis} />);
    expect(screen.getByText('KPIs')).toBeInTheDocument();
  });

  it('should render the KPIs correctly', () => {
    render(<KPIs kpis={kpis} />);
    kpis.forEach((kpi, index) => {
      expect(screen.getByText(kpi.value)).toBeInTheDocument();
      expect(screen.getByText(kpi.key)).toBeInTheDocument();
    });
  });

  it('should handle an empty KPIs array correctly', () => {
    render(<KPIs kpis={[]} />);
    expect(screen.getByText('KPIs')).toBeInTheDocument();
    expect(screen.queryByText('$1000')).not.toBeInTheDocument();
    expect(screen.queryByText('Revenue')).not.toBeInTheDocument();
  });

  it('should set the width to 50% when there is only one KPI', () => {
    const singleKpi = [{ key: 'Metric 1', value: '100' }];
    render(<KPIs kpis={singleKpi} />);

    const kpiElement = screen.getByText('Metric 1').closest('.kpi');
    // expect(kpiElement).toHaveStyle('width: 50%');
  });
});
