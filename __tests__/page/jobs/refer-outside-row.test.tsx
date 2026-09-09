import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FormProvider, useForm } from 'react-hook-form';

const mockUseMemberSearch = jest.fn();

jest.mock('@/prototypes/entries/job-board/components/ReferModal/hooks/useMemberSearch', () => ({
  useMemberSearch: (query: string) => mockUseMemberSearch(query),
}));

import { MemberSearchSelect } from '@/prototypes/entries/job-board/components/ReferModal/components/MemberSearchSelect';

const Harness = ({ onReferOutside }: { onReferOutside?: (typed: string) => void }) => {
  const methods = useForm({ defaultValues: { referee: null } });
  return (
    <FormProvider {...methods}>
      <MemberSearchSelect
        name="referee"
        label="Who are you referring?"
        placeholder="Search members by name..."
        onReferOutside={onReferOutside}
      />
    </FormProvider>
  );
};

const searchState = (over: Partial<ReturnType<typeof mockUseMemberSearch>> = {}) => ({
  results: [],
  isSearching: false,
  hasQuery: false,
  isUnauthorized: false,
  ...over,
});

const OUTSIDE_ROW = /Refer someone outside the network/i;

/* The row and the menu around it. The modal's own suite stubs this component out, so
   everything below is invisible from there — including the two states that only exist
   because the menu now opens before anything is typed. */
describe('MemberSearchSelect: refer someone outside the network', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMemberSearch.mockReturnValue(searchState());
  });

  /* The whole reason the row stands rather than waiting for a query: someone who
     already knows their friend isn't a member shouldn't have to type a name to find
     out they can still refer them. */
  it('offers the row before anything is typed', async () => {
    const user = userEvent.setup();
    render(<Harness onReferOutside={jest.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByRole('button', { name: OUTSIDE_ROW })).toBeInTheDocument();
  });

  /* What opening the menu early costs, and the most likely way this ships broken:
     react-select fills an empty menu with its no-options slot, which would answer a
     question nobody has asked yet. */
  it('does not say "No members found" before anything is typed', async () => {
    const user = userEvent.setup();
    render(<Harness onReferOutside={jest.fn()} />);

    await user.click(screen.getByRole('combobox'));

    await screen.findByRole('button', { name: OUTSIDE_ROW });
    expect(screen.queryByText(/No members found/i)).not.toBeInTheDocument();
  });

  it('shows the row under the no-results line once a query has found nothing', async () => {
    mockUseMemberSearch.mockReturnValue(searchState({ hasQuery: true }));
    const user = userEvent.setup();
    render(<Harness onReferOutside={jest.fn()} />);

    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByText(/No members found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: OUTSIDE_ROW })).toBeInTheDocument();
    /* It used to add "Only members in the directory can be referred." That stopped
       being true the day the row went in. */
    expect(screen.queryByText(/Only members in the directory can be referred/i)).not.toBeInTheDocument();
  });

  it('hands the typed query over, trimmed', async () => {
    const onReferOutside = jest.fn();
    mockUseMemberSearch.mockReturnValue(searchState({ hasQuery: true }));
    const user = userEvent.setup();
    render(<Harness onReferOutside={onReferOutside} />);

    await user.type(screen.getByRole('combobox'), 'Sarah Cohen ');
    await user.click(await screen.findByRole('button', { name: OUTSIDE_ROW }));

    await waitFor(() => expect(onReferOutside).toHaveBeenCalledWith('Sarah Cohen'));
  });

  /* Without the callback the field is a member search and nothing else — the row is
     not a fixture of the menu, it is an offer the host makes. */
  it('renders no row when the host offers no way out', async () => {
    mockUseMemberSearch.mockReturnValue(searchState({ hasQuery: true }));
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByText(/No members found/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: OUTSIDE_ROW })).not.toBeInTheDocument();
  });
});
