'use client';

import dynamic from 'next/dynamic';

/**
 * The editor, loaded in the browser only (LAB-2922).
 *
 * Quill touches `document` while its module evaluates, so a static import anywhere in a server-rendered tree throws
 * `document is not defined` on the server. React recovers by rendering that whole boundary in the browser: the page
 * still works for people, but crawlers get an empty body. That is how project profiles lost their content. Loading it
 * here, at the source, covers every importer; the editor only ever shows in edit mode, after a click.
 *
 * The implementation lives in `RichTextEditorClient`.
 */
const RichTextEditor = dynamic(() => import('./RichTextEditorClient'), { ssr: false });

export default RichTextEditor;
