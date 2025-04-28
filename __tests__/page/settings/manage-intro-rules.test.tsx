import '@testing-library/jest-dom';
const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: refreshMock,
    back: jest.fn(),
  }),
  usePathname: () => '/settings/intro-rules',
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));


import { render, screen, fireEvent } from '@testing-library/react';
import ManageIntroRules from '../../../components/page/settings/manage-intro-rules';
import { IntroRuleData } from '../../../types/intro-rules';


// Mock child components to focus on ManageIntroRules logic
jest.mock('../../../components/page/settings/intro-rules/rules-tab', () => {
  const Mock = (props: any) => <div data-testid="rules-tab">{JSON.stringify(props)}</div>;
  Mock.displayName = 'MockRulesTab';
  return Mock;
});
jest.mock('../../../components/page/settings/intro-rules/tags-tab', () => {
  const Mock = (props: any) => <div data-testid="tags-tab">{JSON.stringify(props)}</div>;
  Mock.displayName = 'MockTagsTab';
  return Mock;
});
jest.mock('../../../components/page/settings/intro-rules/topics-tab', () => {
  const Mock = (props: any) => <div data-testid="topics-tab">{JSON.stringify(props)}</div>;
  Mock.displayName = 'MockTopicsTab';
  return Mock;
});

const mockData: IntroRuleData = {
  rules: [
    {
      id: '1',
      topic: { id: '1', name: 'Protocol Labs' },
      tags: [{ id: '1', name: 'Network' }],
      leads: [],
    },
  ],
  topics: [
    { id: '1', name: 'Protocol Labs' },
    { id: '2', name: 'Filecoin' },
  ],
  tags: [
    { id: '1', name: 'Network' },
    { id: '2', name: 'Blockchain' },
  ],
  members: [
    { id: '1', name: 'Alice', avatar: '/avatar1.png', role: 'Lead' },
    { id: '2', name: 'Bob', avatar: '/avatar2.png', role: 'Lead' },
  ],
};

const userInfo = {
  name: 'Test User',
  uid: 'testuser',
  roles: ['DIRECTORYADMIN'],
  leadingTeams: [],
};

describe('ManageIntroRules', () => {
  beforeEach(() => {
    // Reset window width for each test
    (window as any).innerWidth = 1024;
  });

  it('renders all tabs and default to RULES tab (desktop)', () => {
    render(<ManageIntroRules data={mockData} userInfo={userInfo} />);
    expect(screen.getAllByText('RULES').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TAGS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TOPICS').length).toBeGreaterThan(0);
    // Should render RulesTab by default
    expect(screen.getByTestId('rules-tab')).toBeInTheDocument();
  });

  it('switches to TAGS tab when clicked (desktop)', () => {
    render(<ManageIntroRules data={mockData} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('TAGS'));
    expect(screen.getByTestId('tags-tab')).toBeInTheDocument();
  });

  it('switches to TOPICS tab when clicked (desktop)', () => {
    render(<ManageIntroRules data={mockData} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('TOPICS'));
    expect(screen.getByTestId('topics-tab')).toBeInTheDocument();
  });

  it('passes correct props to RulesTab', () => {
    render(<ManageIntroRules data={mockData} userInfo={userInfo} />);
    const rulesTab = screen.getByTestId('rules-tab');
    expect(rulesTab.textContent).toContain('rules');
    expect(rulesTab.textContent).toContain('topics');
    expect(rulesTab.textContent).toContain('tags');
    expect(rulesTab.textContent).toContain('members');
  });

  it('shows mobile dropdown and switches tabs (mobile)', () => {
    // Simulate mobile
    (window as any).innerWidth = 375;
    // Force re-render with mobile styles
    render(<ManageIntroRules data={mockData} userInfo={userInfo} />);
    // Open dropdown
    const dropdownButton = screen.getByRole('button', { name: /RULES/i });
    fireEvent.click(dropdownButton);
    // Click on TAGS
    fireEvent.click(screen.getByRole('button', { name: /TAGS/i }));
    expect(screen.getByTestId('tags-tab')).toBeInTheDocument();
    // Open dropdown again and click TOPICS
    fireEvent.click(screen.getByRole('button', { name: /TAGS/i }));
    fireEvent.click(screen.getByRole('button', { name: /TOPICS/i }));
    expect(screen.getByTestId('topics-tab')).toBeInTheDocument();
  });

  it('renders with empty data gracefully', () => {
    render(<ManageIntroRules data={{ rules: [], topics: [], tags: [], members: [] }} userInfo={userInfo} />);
    expect(screen.getAllByText('RULES').length).toBeGreaterThan(0);
    expect(screen.getByTestId('rules-tab')).toBeInTheDocument();
  });

});