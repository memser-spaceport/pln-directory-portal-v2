import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ItemDetail from '@/components/page/aligement-assets/feedback/item-detail';
import TriageList from '@/components/page/aligement-assets/feedback/triage-list';
import { item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

function renderItemPage(overrides: Parameters<typeof item>[0] = {}, isAdmin = true) {
  const onAdminUpdate = jest.fn();
  render(
    <ItemDetail
      item={item(overrides)}
      comments={[]}
      isAdmin={isAdmin}
      onVote={jest.fn()}
      onComment={jest.fn()}
      onDeleteComment={jest.fn()}
      onHideComment={jest.fn()}
      onMove={jest.fn()}
      onRetryLinear={jest.fn()}
      onAdminUpdate={onAdminUpdate}
    />,
  );
  return onAdminUpdate;
}

const actions = () => within(screen.getByRole('group', { name: /^Admin actions/ }));

describe('what an admin can change about an item', () => {
  it('changes its type', () => {
    const onAdminUpdate = renderItemPage({ type: 'feature' });

    fireEvent.change(actions().getByRole('combobox', { name: /type/i }), { target: { value: 'bug' } });

    expect(onAdminUpdate).toHaveBeenCalledWith({ type: 'bug' });
  });

  it('makes a private item public', () => {
    const onAdminUpdate = renderItemPage({ type: 'bug', is_public: false });

    fireEvent.click(actions().getByRole('button', { name: 'Make public' }));

    expect(onAdminUpdate).toHaveBeenCalledWith({ is_public: true });
    expect(actions().queryByRole('button', { name: 'Make private' })).not.toBeInTheDocument();
  });

  it('makes a public item private', () => {
    const onAdminUpdate = renderItemPage({ is_public: true });

    fireEvent.click(actions().getByRole('button', { name: 'Make private' }));

    expect(onAdminUpdate).toHaveBeenCalledWith({ is_public: false });
  });
});

describe('removing an item', () => {
  it('asks first, and removes only when the admin confirms', () => {
    const onAdminUpdate = renderItemPage();

    fireEvent.click(actions().getByRole('button', { name: 'Remove' }));
    expect(onAdminUpdate).not.toHaveBeenCalled();

    fireEvent.click(actions().getByRole('button', { name: 'Confirm remove' }));
    expect(onAdminUpdate).toHaveBeenCalledTimes(1);
    expect(onAdminUpdate).toHaveBeenCalledWith({ removed: true });
  });

  it('removes nothing when the admin backs out', () => {
    const onAdminUpdate = renderItemPage();

    fireEvent.click(actions().getByRole('button', { name: 'Remove' }));
    fireEvent.click(actions().getByRole('button', { name: 'Cancel' }));

    expect(onAdminUpdate).not.toHaveBeenCalled();
    expect(actions().getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(actions().queryByRole('button', { name: 'Confirm remove' })).not.toBeInTheDocument();
  });

  it('shows a removed item as removed and offers only to restore it', () => {
    const onAdminUpdate = renderItemPage({ removed_at: '2026-11-01T00:00:00.000Z' });

    expect(actions().getByText('Removed')).toBeInTheDocument();
    expect(actions().queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(actions().queryByRole('combobox')).not.toBeInTheDocument();

    fireEvent.click(actions().getByRole('button', { name: 'Restore' }));
    expect(onAdminUpdate).toHaveBeenCalledWith({ removed: false });
  });
});

describe('who gets these controls', () => {
  it('offers a member none of them', () => {
    renderItemPage({ is_public: false }, false);

    expect(screen.queryByRole('group', { name: /^Admin actions/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^(Remove|Make public|Make private|Restore)$/ }),
    ).not.toBeInTheDocument();
  });

  it('gives each Triage row the controls for that row, and reports which item changed', () => {
    const onAdminUpdate = jest.fn();
    render(
      <TriageList
        items={[
          item({ id: 'first', title: 'First card' }),
          item({ id: 'second', title: 'Second card', type: 'bug', is_public: false }),
        ]}
        onMove={jest.fn()}
        onRetryLinear={jest.fn()}
        onAdminUpdate={onAdminUpdate}
      />,
    );
    const second = within(screen.getByRole('group', { name: 'Admin actions for Second card' }));

    fireEvent.click(second.getByRole('button', { name: 'Make public' }));
    expect(onAdminUpdate).toHaveBeenLastCalledWith('second', { is_public: true });

    fireEvent.click(second.getByRole('button', { name: 'Remove' }));
    fireEvent.click(second.getByRole('button', { name: 'Confirm remove' }));
    expect(onAdminUpdate).toHaveBeenLastCalledWith('second', { removed: true });
  });
});
