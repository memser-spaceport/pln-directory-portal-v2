import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { MembersInvitePrompt, showsMembersInvitePrompt } from '@/components/page/members/MembersInvitePrompt';

// LAB-3398 R6: a Members search with no results offers "Invite them." to a signed-in viewer.

describe('MembersInvitePrompt (LAB-3398)', () => {
  it('links to Settings → Invite after a signed-in search with no results', () => {
    render(<MembersInvitePrompt searchBy="nobody" isUserLoggedIn resultsCount={0} />);

    expect(screen.getByTestId('members-invite-prompt')).toHaveTextContent(
      'Can’t find them? They may not be on LabOS yet. Invite them.',
    );
    expect(screen.getByRole('link', { name: 'Invite them.' })).toHaveAttribute('href', '/settings/invite');
  });

  it.each([
    ['before a search', { searchBy: undefined, isUserLoggedIn: true, resultsCount: 0 }],
    ['for a blank search', { searchBy: '   ', isUserLoggedIn: true, resultsCount: 0 }],
    ['when results exist', { searchBy: 'mira', isUserLoggedIn: true, resultsCount: 3 }],
    ['for a signed-out visitor', { searchBy: 'nobody', isUserLoggedIn: false, resultsCount: 0 }],
  ])('is absent %s', (_label, props) => {
    expect(showsMembersInvitePrompt(props)).toBe(false);
    const { container } = render(<MembersInvitePrompt {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
});
