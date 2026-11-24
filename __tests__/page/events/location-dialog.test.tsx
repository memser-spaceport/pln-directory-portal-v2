import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LocationDialog } from '@/components/page/events/all-events/LocationDialog';

/**
 * LAB-3394: "Your location", opened from Events near you. It saves the profile's location the way the profile's own
 * Location field does (city, region ← metro area, country), through the full profile save, carrying every other field.
 */

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }));

const memberInfo = {
  uid: 'm1',
  email: 'member@example.com',
  name: 'Ada',
  bio: '<p>Hi</p>',
  location: { city: 'Lisbon', region: 'Lisbon', country: 'Portugal' },
  teamMemberRoles: [],
  skills: [],
};
const member: { data: unknown } = { data: { memberInfo } };
jest.mock('@/services/members/hooks/useMember', () => ({ useMember: () => member }));

const mutateAsync = jest.fn();
jest.mock('@/services/members/hooks/useUpdateMember', () => ({
  useUpdateMember: () => ({ mutateAsync, isPending: false }),
}));

const perms = { codes: [] as string[] };
jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => ({ permsSet: new Set(perms.codes) }),
}));

// The place search stand-in: shows what the field would show, and picks Berlin.
jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: (props: {
    onSelect: (place: object) => void;
    resolvedCity?: string;
    resolvedState?: string;
    resolvedCountry?: string;
  }) => (
    <div>
      <span data-testid="shown">{[props.resolvedCity, props.resolvedState, props.resolvedCountry].join(' | ')}</span>
      <button
        type="button"
        onClick={() =>
          props.onSelect({
            city: 'Berlin',
            metroArea: 'Berlin Metro',
            region: 'Berlin State',
            country: 'Germany',
            continent: 'Europe',
            placeId: 'p1',
            latitude: 0,
            longitude: 0,
          })
        }
      >
        Pick Berlin
      </button>
    </div>
  ),
}));

jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const { toast } = jest.requireMock('@/components/core/ToastContainer');

function renderDialog() {
  const onClose = jest.fn();
  const onSaved = jest.fn();
  render(<LocationDialog viewerUid="m1" from="change" onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
}

beforeEach(() => {
  jest.clearAllMocks();
  member.data = { memberInfo };
  perms.codes = [];
});

describe('LocationDialog (LAB-3394)', () => {
  it('shows the saved location, and says the profile changes too', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: 'Your location' })).toBeInTheDocument();
    expect(screen.getByTestId('shown')).toHaveTextContent('Lisbon | Lisbon | Portugal');
    expect(screen.getByText('This also updates the location on your profile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves the picked place to the profile, keeping the rest of it, then refreshes the page', async () => {
    mutateAsync.mockResolvedValue({ data: {} });
    const { onClose, onSaved } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Pick Berlin' }));
    expect(screen.getByTestId('shown')).toHaveTextContent('Berlin | Berlin Metro | Germany');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { uid, payload } = mutateAsync.mock.calls[0][0];
    expect(uid).toBe('m1');
    expect(payload).toMatchObject({
      participantType: 'MEMBER',
      referenceUid: 'm1',
      uniqueIdentifier: 'member@example.com',
    });
    expect(payload.newData).toMatchObject({
      city: 'Berlin',
      region: 'Berlin Metro',
      country: 'Germany',
      name: 'Ada',
      email: 'member@example.com',
      bio: '<p>Hi</p>',
    });
    expect(onSaved).toHaveBeenCalledWith('change');
    expect(refresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Location saved');
  });

  it('keeps the dialog open and says so when the save is refused', async () => {
    mutateAsync.mockResolvedValue({ isError: true, errorData: { message: 'Nope' } });
    const { onClose, onSaved } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Pick Berlin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nope'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('cannot save before the profile has loaded', () => {
    member.data = undefined;
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Pick Berlin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('warns a PLAA member, as the profile field does', () => {
    perms.codes = ['plaa.member'];
    renderDialog();
    expect(screen.getByRole('note')).toHaveTextContent('You may lose access to the page if you change your location.');
  });

  it('closes on Cancel', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
