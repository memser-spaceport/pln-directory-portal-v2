'use client';

import React from 'react';

import { DialogApplicationSearch } from '@/components/core/application-search/DialogApplicationSearch';
import { LegacyApplicationSearch } from '@/components/core/application-search/LegacyApplicationSearch';
import { SHOW_AI_SEARCH_DIALOG } from '@/services/search/constants';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

/**
 * Which header search the app mounts.
 *
 * There are two, and this is the only place that chooses between them —
 * `nav-bar.tsx` renders `ApplicationSearch` and knows nothing about the flag.
 * The two implementations take the same three props, which is what makes the
 * seam a ternary rather than a refactor.
 *
 * The default is the older one. `DialogApplicationSearch` is the rebuild
 * (LAB-2477) and is opt-in per environment until it is promoted; see
 * `SHOW_AI_SEARCH_DIALOG` for why the flag reads this way round.
 *
 * Note that ⌘K belongs to the dialog and disappears with it — the legacy search
 * never had a keyboard shortcut. That is expected, not a regression.
 *
 * DELETE WITH: `SHOW_AI_SEARCH_DIALOG` — at which point this file goes back to
 * being the component it names.
 */
export const ApplicationSearch = (props: Props) =>
  SHOW_AI_SEARCH_DIALOG ? <DialogApplicationSearch {...props} /> : <LegacyApplicationSearch {...props} />;
