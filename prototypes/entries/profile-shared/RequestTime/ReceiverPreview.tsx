'use client';

import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import rc from '@/components/page/demo-day/ActiveView/components/TeamsList/components/ReferCompanyModal/ReferCompanyModal.module.scss';

import { HubItem } from '../../notifications-hub/HubItem';
import s from './RequestTime.module.scss';

/** The visitor in this prototype (mocked; the request carries their real profile). */
export const REQUESTER = { name: 'Alex Rivera', role: 'Founder', team: 'Nebula Labs' };

const SAMPLE_MESSAGE =
  'We’re building a retrieval layer on IPFS and keep hitting the same gateway caching questions you wrote about. 20–30 minutes any afternoon next week would help a lot.';

/**
 * Review band only — LAB-3400 R5 + R6, what the member receives for one
 * request: the email, then the in-app notice (notifications-hub's row, with
 * a proposed "Office hours" category). The email is a sketch for the email
 * template, not a coded template.
 *
 * Email decisions:
 *   - Subject leads with the person, not the product: "Alex Rivera would like
 *     time with you".
 *   - The visitor's note is quoted as written, under who they are.
 *   - Reply goes straight to the visitor (reply-to), and the email says that
 *     replying shares your address — the one thing the member gives away.
 *   - "Set up office hours" is the second action: R1's goal is more members
 *     using office hours, and this is the moment they see why.
 *   - The footer says it is not a booking and the PL team did not send it
 *     (R7), so it does not read as an intro.
 */
export function ReceiverPreview({
  open,
  onClose,
  memberName,
  message,
}: {
  open: boolean;
  onClose: () => void;
  memberName: string;
  message?: string;
}) {
  const first = memberName.split(' ')[0];
  const requesterFirst = REQUESTER.name.split(' ')[0];
  const note = message || SAMPLE_MESSAGE;
  return (
    <Modal isOpen={open} onClose={onClose} lockScroll>
      <div className={clsx(rc.modal, s.preview)}>
        <button type="button" className={rc.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <h2 className={s.previewTitle}>What {first} receives</h2>

        <p className={s.previewLabel}>Email</p>
        <div className={s.email}>
          <dl className={s.emailMeta}>
            <dt>From</dt>
            <dd>LabOS &lt;notifications@os.pl.xyz&gt;</dd>
            <dt>Reply-to</dt>
            <dd>{REQUESTER.name}</dd>
            <dt>Subject</dt>
            <dd className={s.emailSubject}>{REQUESTER.name} would like time with you</dd>
          </dl>
          <div className={s.emailBody}>
            <p>Hi {first},</p>
            <p>
              <strong>{REQUESTER.name}</strong> ({REQUESTER.role}, {REQUESTER.team}) asked for a call on your LabOS
              profile. You haven&apos;t set up office hours, so we&apos;re passing the request on.
            </p>
            <blockquote className={s.emailQuote}>{note}</blockquote>
            <div className={s.emailActions}>
              <span className={clsx(s.emailBtn, s.emailBtnPrimary)}>Reply to {requesterFirst}</span>
              <span className={s.emailBtn}>Set up office hours</span>
            </div>
            <p className={s.emailFine}>
              Replying shares your email address with {requesterFirst}. With office hours set up, people book a time
              with you directly instead of writing first.
            </p>
            <p className={s.emailFine}>
              This isn&apos;t a booking, and it isn&apos;t an intro from the PL team. You can ignore it.
            </p>
          </div>
        </div>

        <p className={s.previewLabel}>In-app notification</p>
        <div className={s.notice}>
          <HubItem
            variant="panel"
            notification={{
              id: 'oh-request',
              category: 'OFFICE_HOURS_REQUEST',
              title: `${REQUESTER.name} would like time with you`,
              description: note,
              minutesAgo: 2,
              isRead: false,
              link: '#',
              linkText: 'View request',
            }}
            onToggleRead={() => undefined}
            onOpen={() => undefined}
          />
        </div>
      </div>
    </Modal>
  );
}
