import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

/**
 * The two project sections that edit in place.
 *
 * Everywhere else the leave guard is free: the member and team profiles are
 * built from shared controls components that register themselves. These two
 * have their own Save and Cancel and their own state, so they register by hand —
 * which means the thing worth pinning is *what they call dirty*, since that is a
 * judgement each one is making on its own rather than inheriting.
 */

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/projects/p1' }));

/* The editor is a Quill wrapper; the section's contract with it is "hand me the
   new value", which this reduces to a textbox. */
jest.mock('@/components/ui/RichTextEditor/RichTextEditor', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

jest.mock('@/analytics/project.analytics', () => ({
  useProjectAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));
jest.mock('@/services/projects.service', () => ({ updateProject: jest.fn() }));

/* The markdown editor, reduced to the same contract. It is loaded through
   `next/dynamic`, so the mock has to sit on the module it resolves to. */
jest.mock('md-editor-rt', () => ({
  MdEditor: ({ modelValue, onChange }: { modelValue: string; onChange: (v: string) => void }) => (
    <textarea aria-label="markdown editor" value={modelValue} onChange={(e) => onChange(e.target.value)} />
  ),
  MdPreview: ({ modelValue }: { modelValue: string }) => <div>{modelValue}</div>,
}));

import { UnsavedEditsPageGuard } from '@/components/common/profile/UnsavedEdits';
import Description from '@/components/page/project-details/description';
import { AdditionalDetails } from '@/components/page/project-details/additional-details';

const renderPage = (description = 'The original description.') =>
  render(
    <UnsavedEditsPageGuard>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/projects">Projects</a>
      <Description description={description} project={{ id: 'p1' }} userHasEditRights user={{ uid: 'u1' }} />
    </UnsavedEditsPageGuard>,
  );

const leave = () => fireEvent.click(screen.getByRole('link', { name: 'Projects' }));
const prompt = () => screen.queryByText(/discard changes\?/i);

describe('leaving the project page with an open editor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not ask when the editor was never opened', () => {
    renderPage();

    leave();

    expect(prompt()).not.toBeInTheDocument();
  });

  /**
   * Opening an editor is not editing.
   *
   * This is the case the snapshot exists for. `AdditionalDetails` seeds an empty
   * readme with a template the moment its editor opens, so a guard comparing
   * against the *stored* value would call it dirty with nothing typed and hold
   * anyone trying to leave. Both sections measure from what the editor opened
   * with instead.
   */
  it('does not ask when the editor is open but nothing has been typed', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText('editor')).toBeInTheDocument();

    leave();

    expect(prompt()).not.toBeInTheDocument();
  });

  it('asks once the description has actually changed', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'Something else entirely.' } });
    leave();

    expect(prompt()).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('stops asking once the edit is cancelled', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'Something else entirely.' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    leave();

    expect(prompt()).not.toBeInTheDocument();
  });

  /* Typing back to where you started is not an unsaved change. */
  it('stops asking if the text is returned to what it was', () => {
    renderPage('The original description.');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'changed' } });

    fireEvent.change(screen.getByLabelText('editor'), { target: { value: 'The original description.' } });
    leave();

    expect(prompt()).not.toBeInTheDocument();
  });

  /**
   * THE CASE THE SNAPSHOT EXISTS FOR.
   *
   * `AdditionalDetails` seeds an empty readme with a template the moment its
   * editor opens. A guard comparing against the *stored* readme would therefore
   * call it dirty before a key was pressed, and hold anyone who opened it and
   * thought better of it. The baseline is what the editor opened with.
   */
  describe('additional details, whose editor seeds itself', () => {
    const renderEmptyReadme = () =>
      render(
        <UnsavedEditsPageGuard>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/projects">Projects</a>
          <AdditionalDetails project={{ id: 'p1', readMe: '' }} userHasEditRights authToken="t" user={null} />
        </UnsavedEditsPageGuard>,
      );

    it('does not ask when the seeded template has not been touched', async () => {
      renderEmptyReadme();

      fireEvent.click(screen.getByText(/click here/i));
      expect(await screen.findByLabelText('markdown editor')).toBeInTheDocument();

      leave();

      expect(prompt()).not.toBeInTheDocument();
    });

    it('asks once the seeded template has been edited', async () => {
      renderEmptyReadme();
      fireEvent.click(screen.getByText(/click here/i));

      fireEvent.change(await screen.findByLabelText('markdown editor'), { target: { value: '# My project' } });
      leave();

      expect(prompt()).toBeInTheDocument();
    });
  });
});
