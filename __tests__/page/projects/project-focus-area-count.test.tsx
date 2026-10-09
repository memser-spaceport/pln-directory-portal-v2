import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { ConnectedFocusAreaFilter } from '@/components/core/FocusAreaFilter';
import { IFocusArea } from '@/types/shared.types';

jest.mock('@/hooks/useUpdateQueryParams', () => ({
  __esModule: true,
  default: () => ({ updateQueryParams: jest.fn() }),
}));

const area = (overrides: Partial<IFocusArea>): IFocusArea => ({
  uid: 'fa',
  title: 'Area',
  description: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  parentUid: '',
  children: [],
  teamAncestorFocusAreas: [],
  projectAncestorFocusAreas: [],
  ...overrides,
});

const projects = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ project: { uid: `p${i}`, name: `Project ${i}` } }));

describe('Focus area filter counts', () => {
  it('shows the projectCount after the name in the format "Data (12)" on the projects page', () => {
    const rawData = [area({ uid: 'data', title: 'Data', projectCount: 12, projectAncestorFocusAreas: projects(12) })];

    render(
      <ConnectedFocusAreaFilter
        focusAreas={{ rawData, selectedFocusAreas: [] }}
        countKey="projectAncestorFocusAreas"
        searchParams={{}}
        countInLabel
      />,
    );

    expect(screen.getByText('Data (12)')).toBeInTheDocument();
    expect(screen.queryByText('12')).not.toBeInTheDocument();
  });

  it('shows "(0)" for a focus area with no projects', () => {
    const rawData = [area({ uid: 'empty', title: 'Empty', projectCount: 0, projectAncestorFocusAreas: [] })];

    render(
      <ConnectedFocusAreaFilter
        focusAreas={{ rawData, selectedFocusAreas: [] }}
        countKey="projectAncestorFocusAreas"
        searchParams={{}}
        countInLabel
      />,
    );

    expect(screen.getByText('Empty (0)')).toBeInTheDocument();
  });

  it('uses projectCount from the API instead of the length of the project list', () => {
    const rawData = [area({ uid: 'data', title: 'Data', projectCount: 5, projectAncestorFocusAreas: projects(3) })];

    render(
      <ConnectedFocusAreaFilter
        focusAreas={{ rawData, selectedFocusAreas: [] }}
        countKey="projectAncestorFocusAreas"
        searchParams={{}}
        countInLabel
      />,
    );

    expect(screen.getByText('Data (5)')).toBeInTheDocument();
  });

  it('keeps the round count badge when the count is not shown in the label (teams and jobs filters)', () => {
    const rawData = [area({ uid: 'data', title: 'Data', teamAncestorFocusAreas: projects(4) as any })];

    render(
      <ConnectedFocusAreaFilter
        focusAreas={{ rawData, selectedFocusAreas: [] }}
        countKey="teamAncestorFocusAreas"
        searchParams={{}}
      />,
    );

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('Data (4)')).not.toBeInTheDocument();
  });
});
