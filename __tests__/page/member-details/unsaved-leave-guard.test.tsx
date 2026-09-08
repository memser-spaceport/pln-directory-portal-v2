import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';

/**
 * Leaving the member profile with a section still open and edited.
 *
 * The interception is at the DOM, not at the router, and that is the whole
 * point: `next/link` navigates through `dispatchNavigateAction`, not through the
 * `push` on the object `useRouter()` returns, so the patch-`router.push`
 * approach in `hooks/useUnsavedChangesWarning` cannot see a navbar click. These
 * tests use a real `next/link`-shaped anchor for exactly that reason — a test
 * that clicked a `router.push` button would pass against the broken approach.
 */

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/members/m1',
}));

import { UnsavedEditsPageGuard } from '@/components/common/profile/UnsavedEdits';
import { EditFormControls } from '@/components/common/profile/EditFormControls';

/** A section that opens on a press, like the real ones. */
const Section = () => {
  const [open, setOpen] = React.useState(false);
  const methods = useForm({ defaultValues: { value: '' } });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Edit section
      </button>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        <EditFormControls onClose={() => methods.reset()} title="Edit Profile Details" />
        <input aria-label="field" {...methods.register('value')} />
      </form>
    </FormProvider>
  );
};

const renderPage = () =>
  render(
    <UnsavedEditsPageGuard>
      {/* The navbar's shape: a plain anchor, which is what `next/link` renders —
          and using the real `Link` here would need an App Router context this
          suite has no other reason to build. `no-html-link-for-pages` exists to
          stop production code causing full page loads; a fixture standing in for
          what Link renders is the one place that does not apply. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/members">Directory</a>
      <a href="https://example.com/elsewhere">Off-site</a>
      <a href="#bio">Same page, different hash</a>
      <Section />
    </UnsavedEditsPageGuard>,
  );

const dirty = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit section' }));
  fireEvent.change(screen.getByLabelText('field'), { target: { value: 'typed' } });
};

const prompt = () => screen.queryByText(/discard changes\?/i);

describe('leaving the member profile with unsaved sections', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lets an in-app link through when nothing is edited', () => {
    renderPage();

    fireEvent.click(screen.getByRole('link', { name: 'Directory' }));

    expect(prompt()).not.toBeInTheDocument();
  });

  it('asks before following an in-app link when a section is edited', () => {
    renderPage();
    dirty();

    fireEvent.click(screen.getByRole('link', { name: 'Directory' }));

    expect(prompt()).toBeInTheDocument();
    // And has not navigated yet.
    expect(push).not.toHaveBeenCalled();
  });

  it('navigates to the link that was blocked, once discarded', () => {
    renderPage();
    dirty();
    fireEvent.click(screen.getByRole('link', { name: 'Directory' }));

    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(push).toHaveBeenCalledWith('/members');
    expect(prompt()).not.toBeInTheDocument();
  });

  it('stays put on Continue Editing, with the edit intact', () => {
    renderPage();
    dirty();
    fireEvent.click(screen.getByRole('link', { name: 'Directory' }));

    fireEvent.click(screen.getByRole('button', { name: /continue editing/i }));

    expect(prompt()).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText('field')).toHaveValue('typed');
  });

  /* Not leaving the page, so not a question worth asking. An in-page anchor
     resolves to the current pathname, which is how this is recognised. */
  it('ignores a link to the same page with a different hash', () => {
    renderPage();
    dirty();

    fireEvent.click(screen.getByRole('link', { name: /different hash/i }));

    expect(prompt()).not.toBeInTheDocument();
  });

  /* Off-site is the browser's business — `beforeunload` covers it, and taking
     it over here would mean the app's prompt followed by the browser's. */
  it('leaves an off-site link to the browser', () => {
    renderPage();
    dirty();

    fireEvent.click(screen.getByRole('link', { name: 'Off-site' }));

    expect(prompt()).not.toBeInTheDocument();
  });

  /* Cmd/ctrl-click opens a new tab. The page is not being left, and cancelling
     it would break the thing the person actually asked for. */
  it('ignores a modified click, which is opening a new tab', () => {
    renderPage();
    dirty();

    fireEvent.click(screen.getByRole('link', { name: 'Directory' }), { metaKey: true });

    expect(prompt()).not.toBeInTheDocument();
  });

  describe('closing the tab', () => {
    const beforeUnload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };

    it('does not interrupt when nothing is edited', () => {
      renderPage();

      expect(beforeUnload().defaultPrevented).toBe(false);
    });

    it('interrupts when a section is edited', () => {
      renderPage();
      dirty();

      expect(beforeUnload().defaultPrevented).toBe(true);
    });

    /* The listener is only attached while something is dirty, so a page that is
       clean again must stop interrupting — otherwise every profile visit would
       ask on reload forever after one edit. */
    it('stops interrupting once the edit is cancelled', () => {
      renderPage();
      dirty();
      expect(beforeUnload().defaultPrevented).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(beforeUnload().defaultPrevented).toBe(false);
    });
  });
});
