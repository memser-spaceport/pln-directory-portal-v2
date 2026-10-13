'use client';

import clsx from 'clsx';

import { SubmitPlusIcon } from '../team-profile/icons';

// Production's glossy primary, by class: OfficeHoursView's `primaryButton`
// (brand fill, three inset/drop token shadows, hairline border, 14/20 500
// label) — the Schedule Meeting button on member profiles.
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import local from './Newsfeed.module.scss';

/**
 * The feed's Post news, in the Schedule Meeting style ("Add style we have for
 * Schedule meeting"). Same press and same modal as the team profile's rail
 * button; the rail keeps its small DS button because it sits in a side
 * section's corner, while here it closes the feed's own control row after
 * Sort. The bare plus is the glyph every creation door here wears
 * (`team-profile/icons.tsx`). `.postNewsGlossy` resets the class's card
 * layout values, as the member page's `.scheduleBtn` does.
 */
export function FeedPostNewsButton({ onPost, className }: { onPost: () => void; className?: string }) {
  return (
    <button type="button" className={clsx(office.primaryButton, local.postNewsGlossy, className)} onClick={onPost}>
      <SubmitPlusIcon size={14} />
      Post news
    </button>
  );
}
