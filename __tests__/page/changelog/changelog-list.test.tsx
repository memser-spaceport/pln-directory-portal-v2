import ChangelogList from '@/components/page/changelog/changelog-list';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/utils/constants', () => ({
  ChangeLogList: [
    {
      title: 'Version 3.0.1 - Office Hours Feedback',
      tag: 'New Feature',
      date: '13, Aug 2024',
      releaseType: { name: 'Beta', icon: '/icons/dot-purple.svg' },
      shortContent: `
        <div style="font-size: 14px; line-height:23px;">
        <p>Exciting news!</p>
        <br/>
        <p>You can now provide feedback for every Office Hour you book by sharing your experiences, suggestions, and insights, helping us improve the network collaboration.</p>
        <p style="margin-top: 20px"> However, don't worry if you missed providing your feedback. All your missed notifications will be available on your Notifications Page, so you can catch up at your convenience by accessing the page using the bell icon on the top navigation bar.</p>
        </div>`,
    },
    {
      title: 'Version 2.0.3 - Improved People Search',
      tag: 'Improvements',
      date: '03, Apr 2024',
      shortContent: `<div>
          <ul style="list-style: disc; font-size: 14px;  line-height:23px;">
          With this update, in addition to the current capability of searching by people name, this enhancement will allow the members to be searched using a team name as well. Every people of the team would be returned in the search result.
          </ul></div>`,
    },
  ],
  tagColors: [
    {
      name: 'New Feature',
      color: '#2ABC76',
    },
  ],
}));

describe('ChangelogList Component', () => {
  test('renders ChangelogList without crashing', () => {
    render(<ChangelogList />);
    expect(
      screen.getByRole('heading', {
        name: /changelog/i,
      })
    ).toBeInTheDocument();
  });

  test('displays change log date, tag, and title', () => {
    render(<ChangelogList />);
    expect(screen.getByText('13, Aug 2024')).toBeInTheDocument();
    expect(screen.getByText('New Feature')).toBeInTheDocument();
    expect(screen.getByText('Version 3.0.1 - Office Hours Feedback')).toBeInTheDocument();
  });

  test('conditionally renders release type if present', () => {
    render(<ChangelogList />);
    expect(screen.getByAltText('tag')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    // Second entry should not have release type information
    expect(screen.queryByText('Major')).not.toBeInTheDocument();
  });

  test('applies correct border styles', () => {
    render(<ChangelogList />);
    const firstEntry = screen.getByTestId('changelog-0');
    const lastEntry = screen.getByTestId('changelog-1');
    expect(firstEntry).toHaveClass('change-log-entry-border');
    expect(lastEntry).not.toHaveClass('change-log-entry-border');
  });
});
