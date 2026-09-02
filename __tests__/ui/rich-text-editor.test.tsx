/**
 * Pins the stability of the `modules` prop RichTextEditor hands to ReactQuill.
 *
 * react-quill-new deep-compares `modules` (lodash isEqual) on every update
 * and, on any mismatch, destroys and recreates the whole Quill instance —
 * invisibly, since contents and selection are restored. Distinct function
 * references never compare equal, so a `modules` object rebuilt per render
 * regenerates the editor per render and orphans every listener attached via
 * getEditor(). That is how mention detection died in the feed composer, which
 * passes an inline `toolbarConfig={[]}`: the dropdown never opened while the
 * same editor kept working on /forum, whose toolbar config is referentially
 * stable. These tests re-render with fresh config identities and assert the
 * regeneration predicate stays quiet.
 */
import React from 'react';
import { render } from '@testing-library/react';
import isEqual from 'lodash/isEqual';

import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

// Overrides the null-rendering stub from jest.setup.js: this suite asserts on
// the props ReactQuill receives, so the stub must record them.
jest.mock('react-quill-new', () => {
  const ReactLib = require('react');
  const capturedProps: unknown[] = [];
  const MockReactQuill = ReactLib.forwardRef((props: Record<string, unknown>, _ref: unknown) => {
    capturedProps.push(props);
    return null;
  });
  (MockReactQuill as unknown as { capturedProps: unknown[] }).capturedProps = capturedProps;
  class MockBlot {}
  return {
    __esModule: true,
    default: MockReactQuill,
    Quill: {
      register: jest.fn(),
      import: jest.fn(() => MockBlot),
    },
  };
});

const capturedProps: { modules: unknown }[] = (require('react-quill-new') as any).default.capturedProps;

function lastTwoModules() {
  expect(capturedProps.length).toBeGreaterThanOrEqual(2);
  const [prev, next] = capturedProps.slice(-2);
  return { prev: prev.modules, next: next.modules };
}

describe('RichTextEditor modules stability', () => {
  beforeEach(() => {
    capturedProps.length = 0;
  });

  it('keeps modules deep-equal across re-renders with an inline empty toolbarConfig (feed composer)', () => {
    const { rerender } = render(
      <RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[]} enableMentions />,
    );
    // A fresh [] every render, plus a value change — the feed composer does
    // exactly this on every keystroke.
    rerender(<RichTextEditor value="<p>@a</p>" onChange={() => undefined} toolbarConfig={[]} enableMentions />);

    const { prev, next } = lastTwoModules();
    expect(isEqual(prev, next)).toBe(true);
  });

  it('keeps modules deep-equal across re-renders with the default toolbar (forum editor)', () => {
    const { rerender } = render(<RichTextEditor value="<p></p>" onChange={() => undefined} />);
    rerender(<RichTextEditor value="<p>hello</p>" onChange={() => undefined} />);

    const { prev, next } = lastTwoModules();
    expect(isEqual(prev, next)).toBe(true);
  });

  it('keeps modules deep-equal when an equal-content toolbarConfig arrives with a new identity', () => {
    const { rerender } = render(
      <RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[['bold', 'italic']]} />,
    );
    rerender(<RichTextEditor value="<p>hello</p>" onChange={() => undefined} toolbarConfig={[['bold', 'italic']]} />);

    const { prev, next } = lastTwoModules();
    expect(isEqual(prev, next)).toBe(true);
  });

  it('rebuilds modules when the toolbar content actually changes', () => {
    const { rerender } = render(<RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[]} />);
    rerender(<RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[['bold']]} />);

    const { prev, next } = lastTwoModules();
    expect(isEqual(prev, next)).toBe(false);
  });

  it("disables Quill's data-URI uploader when the toolbar has image", () => {
    render(<RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[['image']]} />);
    const modules = capturedProps[0].modules as {
      uploader?: { mimetypes: string[] };
      imageUploader?: unknown;
    };
    expect(modules.uploader).toEqual({ mimetypes: [] });
    expect(modules.imageUploader).toBeDefined();
  });

  it("leaves Quill's uploader alone when the toolbar has no image", () => {
    render(<RichTextEditor value="<p></p>" onChange={() => undefined} toolbarConfig={[]} />);
    const modules = capturedProps[0].modules as { uploader?: unknown; imageUploader?: unknown };
    expect(modules.uploader).toBeUndefined();
    expect(modules.imageUploader).toBeUndefined();
  });
});
