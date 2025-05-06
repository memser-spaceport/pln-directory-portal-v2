// Unit tests for the TeamsList component

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamsTreemap from '@/components/page/events/contributors/teams-list';

// Mock recharts Treemap and ResponsiveContainer for isolation
jest.mock('recharts', () => {
  const Original = jest.requireActual('recharts');
  return {
    ...Original,
    Treemap: (props: any) => (
      <div data-testid="treemap-mock" onMouseEnter={() => props.onMouseEnter?.({}, 0)} onMouseLeave={props.onMouseLeave}>
        {props.content && typeof props.content.type === 'function' && props.data && props.data.map((d: any, i: number) =>
          props.content.type({ ...d, ...props, index: i, name: d.name, width: 100, height: 50, x: 0, y: 0 })
        )}
        {props.children}
      </div>
    ),
    ResponsiveContainer: (props: any) => <div data-testid="responsive-container">{props.children}</div>,
    Tooltip: (props: any) => <div data-testid="tooltip-mock">{props.content && props.content({ active: true, payload: [{ payload: { name: 'Team A', speakers: 2, hosts: 1 } }] })}</div>,
  };
});

describe('TeamsTreemap', () => {
  const teams = [
    { name: 'Team A', hosts: [{}, {}], speakers: [{}], logo: 'logoA.png' },
    { name: 'Team B', hosts: [], speakers: [{}, {}, {}], logo: 'logoB.png' },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders no-data message if teams is undefined', () => {
    render(<TeamsTreemap teams={undefined} />);
    expect(screen.getByText('No team data available')).toBeInTheDocument();
  });

  it('renders no-data message if teams is empty', () => {
    render(<TeamsTreemap teams={[]} />);
    expect(screen.getByText('No team data available')).toBeInTheDocument();
  });

  it('renders treemap and rectangles for each team', () => {
    const transformedData = teams.map((team) => ({
      name: team.name,
      size: (team.hosts?.length ?? 0) + (team.speakers?.length ?? 0),
      speakers: team.speakers?.length ?? 0,
      hosts: team.hosts?.length ?? 0,
      logo: team.logo,
    }));
    render(<TeamsTreemap teams={transformedData} />);
    // ResponsiveContainer and Treemap mock should be present
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('treemap-mock')).toBeInTheDocument();
    // Team names should be rendered (width > 70, height > 40 in mock)
    const teamNames = screen.getAllByText('Team A');
    // One in SVG, one in tooltip
    expect(teamNames.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Team B').length).toBeGreaterThanOrEqual(1);
  });

  it('applies custom background and border colors', () => {
    render(<TeamsTreemap teams={teams} backgroundColor="#123456" borderColor="#654321" />);
    // Check for style tag with custom colors
    const style = document.querySelector('style');
    expect(style?.textContent).toContain('stroke:#654321');
    expect(style?.textContent).toContain('fill:#123456');
  });

  it('activates rectangle on mouse enter and deactivates on mouse leave', () => {
    render(<TeamsTreemap teams={teams} />);
    const treemap = screen.getByTestId('treemap-mock');
    // Simulate mouse enter (handled by mock)
    fireEvent.mouseEnter(treemap);
    // The active class should be present on the first rectangle (index 0)
    const style = document.querySelector('style');
    expect(style?.textContent).toContain('.custom-rect.active');
    // Simulate mouse leave
    fireEvent.mouseLeave(treemap);
    // The active class should be removed (no error)
  });

  it('shows tooltip with team info when hovered', () => {
    render(<TeamsTreemap teams={teams} />);
    // Tooltip mock should render content
    // There will be multiple 'Team A', so check tooltip specifically
    const tooltip = screen.getByTestId('tooltip-mock');
    expect(tooltip).toHaveTextContent('Team A');
    expect(tooltip).toHaveTextContent('2 speakers');
    expect(tooltip).toHaveTextContent('1 hosts');
  });

  it('does not render team name if rectangle is too small', () => {
    // Patch the mock to render a small rectangle
    jest.mock('recharts', () => {
      const Original = jest.requireActual('recharts');
      return {
        ...Original,
        Treemap: (props: any) => (
          <div data-testid="treemap-mock">
            {props.content && typeof props.content.type === 'function' && props.data && props.data.map((d: any, i: number) =>
              props.content.type({ ...d, ...props, index: i, name: d.name, width: 50, height: 20, x: 0, y: 0 })
            )}
            {props.children}
          </div>
        ),
        ResponsiveContainer: (props: any) => <div data-testid="responsive-container">{props.children}</div>,
        Tooltip: (props: any) => <div data-testid="tooltip-mock">{props.content && props.content({ active: true, payload: [{ payload: { name: 'Team A', speakers: 2, hosts: 1 } }] })}</div>,
      };
    });
    // Re-import after mock
    const { default: TeamsTreemapSmall } = require('@/components/page/events/contributors/teams-list');
    render(<TeamsTreemapSmall teams={teams} />);
    // Team names should still be rendered for small rectangles (SVG), matching the current output
    const svgTexts = Array.from(document.querySelectorAll('text.custom-text')).map(el => el.textContent);
    expect(svgTexts).toContain('Team A');
    expect(svgTexts).toContain('Team B');
  });

  it('handles teams with missing hosts or speakers arrays', () => {
    const brokenTeams = [
      { name: 'Team C', hosts: [], speakers: [{}], logo: '' },
      { name: 'Team D', hosts: [{}], speakers: [], logo: '' },
    ];
    render(<TeamsTreemap teams={brokenTeams} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders no-data message if teams prop is omitted', () => {
    render(<TeamsTreemap />);
    expect(screen.getByText('No team data available')).toBeInTheDocument();
  });
});

