'use client';

import { createContext, useContext } from 'react';

/**
 * Who is asking. AI Search answers the same question differently per seat —
 * production already does, on what the asker may read. The one seat this
 * prototype adds is a **founder** (lead of a non-fund team): their investor
 * answers carry the intro rows, everyone else's are the directory's alone.
 *
 * A context rather than a prop, because the seat is a fact about the session
 * and the view is mounted from more than one host page.
 */
export type AiSearchViewer = 'member' | 'founder';

export const AiSearchViewerContext = createContext<AiSearchViewer>('member');

export const useAiSearchViewer = () => useContext(AiSearchViewerContext);
