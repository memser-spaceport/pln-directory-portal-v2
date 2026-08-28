import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ProfileHero from '@/components/page/aligement-assets/profile/profile-hero';
import type { ProfileIdentity, ProfileBalance } from '@/services/plaa/hooks/useProfileData';

const identity: ProfileIdentity = {
  name: 'Alex Rivera',
  initials: 'AR',
  memberSince: 'January 2025',
  isOnboarded: true,
  isInfraMember: true,
};

const balance: ProfileBalance = {
  plaaBalance: 112,
  activities: 102,
  infraRewards: 60,
  redeemed: 50,
};

describe('ProfileHero', () => {
  it('renders identity and collapsed balance state by default', () => {
    render(<ProfileHero identity={identity} balance={balance} balanceStatus="ready" pointsThisSnapshot={420} />);

    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Member since January 2025')).toBeInTheDocument();
    expect(screen.getByText('Onboarded')).toBeInTheDocument();
    expect(screen.getByText('Infra Member')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByText('Points this snapshot')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.queryByText('Activities')).not.toBeInTheDocument();
  });

  it('hides the infra pill and infra rewards row for non-infra members', () => {
    render(
      <ProfileHero
        identity={{ ...identity, isInfraMember: false }}
        balance={balance}
        balanceStatus="ready"
        pointsThisSnapshot={420}
      />
    );
    expect(screen.queryByText('Infra Member')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show plaa balance breakdown/i }));
    expect(screen.queryByText('Infra rewards')).not.toBeInTheDocument();
  });

  it('swaps points-this-snapshot for the balance breakdown when toggled open', async () => {
    render(<ProfileHero identity={identity} balance={balance} balanceStatus="ready" pointsThisSnapshot={420} />);

    fireEvent.click(screen.getByRole('button', { name: /show plaa balance breakdown/i }));

    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('Infra rewards')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('Redeemed')).toBeInTheDocument();
    expect(screen.getByText('−50')).toBeInTheDocument();
    // "Points this snapshot" exits via a framer-motion animation, so it isn't
    // removed from the DOM synchronously — wait for the exit to finish.
    await waitFor(() => expect(screen.queryByText('Points this snapshot')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /hide plaa balance breakdown/i }));
    expect(screen.getByText('Points this snapshot')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Activities')).not.toBeInTheDocument());
  });

  it('shows a hover tooltip on the PLAA balance toggle, independent of expand/collapse', () => {
    render(<ProfileHero identity={identity} balance={balance} balanceStatus="ready" pointsThisSnapshot={420} />);
    const toggle = screen.getByRole('button', { name: /show plaa balance breakdown/i });

    expect(screen.queryByText('Show PLAA balance breakdown', { selector: 'span' })).not.toBeInTheDocument();

    fireEvent.mouseEnter(toggle);
    expect(screen.getByText('Show PLAA balance breakdown', { selector: 'span' })).toBeInTheDocument();

    fireEvent.mouseLeave(toggle);
    expect(screen.queryByText('Show PLAA balance breakdown', { selector: 'span' })).not.toBeInTheDocument();
  });

  it('uses an SVG caret icon that rotates on expand, not a text arrow character', () => {
    const { container } = render(<ProfileHero identity={identity} balance={balance} balanceStatus="ready" pointsThisSnapshot={420} />);

    expect(container.textContent).not.toMatch(/[▲▼]/);
    // Hero uses the horizontal chevron variant (points right, rotates to left).
    const caretSvg = container.querySelector('svg path[d="M9 6l6 6-6 6"]');
    expect(caretSvg).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show plaa balance breakdown/i }));
    const rotatedCaret = caretSvg?.closest('svg') as SVGElement;
    expect(rotatedCaret.getAttribute('style')).toContain('rotate(180deg)');
  });

  it('renders the real balance with "Confirmed by Surus" only when balanceStatus is ready', () => {
    render(<ProfileHero identity={identity} balance={balance} balanceStatus="ready" pointsThisSnapshot={420} />);

    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('Confirmed by Surus')).toBeInTheDocument();
  });

  it('shows a loading placeholder, not a fabricated zero or the "Confirmed by Surus" badge, while balanceStatus is loading', () => {
    const zeroBalance: ProfileBalance = { plaaBalance: 0, activities: 0, infraRewards: 0, redeemed: 0 };
    render(<ProfileHero identity={identity} balance={zeroBalance} balanceStatus="loading" pointsThisSnapshot={420} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmed by Surus')).not.toBeInTheDocument();
  });

  it('shows an unavailable placeholder, not a fabricated zero or the "Confirmed by Surus" badge, when balanceStatus is unavailable', () => {
    const zeroBalance: ProfileBalance = { plaaBalance: 0, activities: 0, infraRewards: 0, redeemed: 0 };
    render(<ProfileHero identity={identity} balance={zeroBalance} balanceStatus="unavailable" pointsThisSnapshot={420} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmed by Surus')).not.toBeInTheDocument();
  });
});
