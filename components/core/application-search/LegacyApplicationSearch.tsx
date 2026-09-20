'use client';

import React from 'react';

import { AppSearchDesktop } from '@/components/core/application-search/components/AppSearchDesktop';
import { AppSearchMobile } from '@/components/core/application-search/components/AppSearchMobile';
import { IUserInfo } from '@/types/shared.types';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

/**
 * The header search as it was before LAB-2477 rebuilt it into one dialog: two
 * surfaces, each with its own trigger and panel, separated by media queries.
 *
 * This is what ships. `SHOW_AI_SEARCH_DIALOG` off — the default — selects it;
 * `DialogApplicationSearch` is the opt-in. Restored from `de644d92a`, the last
 * commit before the rebuild, rather than from `main`, which is missing two
 * fixes to this UI (`de644d92a` itself and `34e44d961`).
 *
 * DELETE WITH: `SHOW_AI_SEARCH_DIALOG`, once the dialog is promoted. Going with
 * it: the `AppSearchDesktop`, `AppSearchMobile`, `FullSearchPanel`,
 * `FullSearchResults`, `AiChatPanel`, `AiConversationHistory` and `NothingFound`
 * folders, and `services/search/hooks/useRecordRecentSearch.ts`.
 *
 * Two surfaces can be mounted at once here — unlike the dialog, which must pick
 * one at runtime — because each one's trigger *and* panel sit inside the same
 * media-query-hidden root. Nothing here portals to <body>.
 */
export const LegacyApplicationSearch = ({ isLoggedIn, userInfo, authToken }: Props) => {
  return (
    <>
      <AppSearchDesktop isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
      <AppSearchMobile isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
    </>
  );
};
