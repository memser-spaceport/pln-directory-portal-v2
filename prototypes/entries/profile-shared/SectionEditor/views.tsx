'use client';

import { Fragment } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { Divider } from '@/components/common/profile/Divider';
import { EditButton } from '@/components/common/profile/EditButton';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getProfileFromURL } from '@/utils/common.utils';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

// Production's own sheets for the two read views — the owner's Office Hours
// card and the contact handles block — imported by the component that wears
// them, as every card on both host pages is.
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import contact from '@/components/page/member-details/contact-details/ContactDetails.module.scss';

import type { ContactHandles, ProfileRecord } from './types';

/**
 * The read views the section editors' Save lands on, where both hosts show
 * the same thing. The header card is not here: the filled profile draws
 * dev's header for a member with teams, the new one draws dev's header for a
 * member with none, and those are two transcriptions rather than one view.
 */

/**
 * `OfficeHoursView` — the owner's view: the "Available to connect" hint on the
 * title, Edit in the header, no Schedule Meeting (you do not book yourself).
 * The "Learn more" link is left out: it opens a production dialog.
 */
export function OfficeHoursOwnerView({ profile, onEdit }: { profile: ProfileRecord; onEdit: () => void }) {
  return (
    <div className={office.root}>
      <DetailsSectionHeader
        title={
          <>
            Office Hours{' '}
            {profile.officeHours && <span className={office.titleHintLabel}>&#8226; Available to connect</span>}
          </>
        }
      >
        <EditButton onClick={onEdit} />
      </DetailsSectionHeader>
      <div className={office.content}>
        <div className={office.officeHoursSection}>
          <div className={office.col}>
            <div className={office.description}>
              <div>
                <span>
                  {profile.name} is available for a short 1:1 call to connect or help — no introduction needed.
                </span>
              </div>
              <KeywordsRow label="Topics of Interest:" items={profile.ohInterest} onAdd={onEdit} />
              <KeywordsRow label="I Can Help With:" items={profile.ohHelpWith} onAdd={onEdit} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** `OfficeHoursView`'s keyword row — badges, or the owner's "Add keywords" when empty. */
function KeywordsRow({ label, items, onAdd }: { label: string; items: string[]; onAdd: () => void }) {
  return (
    <div className={office.keywordsWrapper}>
      <span className={office.keywordsLabel}>{label}</span>
      <span className={office.badgesWrapper}>
        {items.length ? (
          items.map((item) => (
            <div key={item} className={office.badge}>
              {item}
            </div>
          ))
        ) : (
          <button type="button" className={office.addKeywordsBadge} onClick={onAdd}>
            <AddIcon /> Add keywords
          </button>
        )}
      </span>
    </div>
  );
}

/** The handles a profile shows, in `contact-details`' order. */
export const VISIBLE_HANDLES: Array<keyof ContactHandles> = [
  'email',
  'linkedin',
  'telegram',
  'twitter',
  'bluesky',
  'discord',
  'github',
];

/**
 * `contact-details`' grey `.social` block: every filled handle a
 * `ProfileSocialLink`, a rule between them, live. Not `isPreview`: that is
 * production's *blurred* row — the "sign in to see contacts" state a visitor
 * gets — and the new-member page had worn it on its one email row on the
 * argument that a mocked address has no inbox. A handle you just typed,
 * blurred on your own card, reads as hidden from you; and a `mailto:` or a
 * LinkedIn URL in a mock opens the mail client or LinkedIn, which is what the
 * real row does too.
 */
export function ContactHandlesList({ contacts }: { contacts: ContactHandles }) {
  const filled = VISIBLE_HANDLES.filter((key) => contacts[key]);
  return (
    <div className={contact.social}>
      <div className={contact.top}>
        <div className={contact.content}>
          {filled.map((key, i) => {
            const handle = contacts[key];
            return (
              <Fragment key={key}>
                <ProfileSocialLink
                  profile={getProfileFromURL(handle, key)}
                  height={24}
                  width={24}
                  /* No analytics in the prototype — production sends a
                     `contact clicked` event from here. */
                  callback={() => {}}
                  type={key}
                  handle={handle}
                  logo={getContactLogoByProvider(key)}
                />
                {i === filled.length - 1 ? null : <Divider />}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** `OfficeHoursView`'s plus beside "Add keywords". */
const AddIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);
