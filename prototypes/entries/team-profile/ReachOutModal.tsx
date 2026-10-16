'use client';

import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

// The product's standard modal shell — the pair Edit criteria and Post news wear.
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import ideaModalStyles from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
// The job application's last step, which this is from the other side: its
// lede, its block column, and its "Your profile" read-back, verbatim.
import pd from '../job-board/JobApplyFlowDrawer.module.scss';
import ap from '../job-board/JobApplicationPane.module.scss';
import { DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';
import dsh from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/DetailsSectionHeader.module.scss';
// The referral email's template block: label row with Reset to template, the
// description above the box, and the prefilled draft.
import refer from '../job-board/components/ReferModal/ReferModal.module.scss';
import taCss from '@/components/form/FormTextArea/FormTextArea.module.scss';

import s from './ReachOutModal.module.scss';

const MESSAGE_MAX_LENGTH = 2000;

export interface ReachOutSender {
  name: string;
  /** "Head of Engineering" — the role alone; the team is the modal's. */
  role: string;
  avatar: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** The member being written to. */
  personName: string;
  roleTitle: string;
  teamName: string;
  postingHref?: string;
  sender: ReachOutSender;
  /** The draft, held by the page per person so closing the modal never costs it. */
  draft: string | undefined;
  onDraftChange: (text: string) => void;
  onSend: (text: string) => void;
}

/**
 * **Contact <name>** — the lead writing to a suggested member (LAB-2819,
 * design review 2026-10-13).
 *
 * It is the job application's last step, run the other way. There a member
 * sends a hiring team their profile and a note; here the team's lead sends a
 * member theirs and an email. Same parts in the same order: one sentence
 * naming the role and what leaves, the lead's card as the member will see it
 * (face, name, role), then
 * the email — the referral modal's template block, prefilled, with Reset to
 * template once edited.
 *
 * **It goes through the platform.** The member gets an email from the PL
 * Network with this text, the lead's profile and a link to the role; replying
 * reaches the lead. That is why the short card shows no contact details.
 *
 * Mocked: Send records the email on the page and closes. Nothing is sent.
 */
export function ReachOutModal({
  open,
  onClose,
  personName,
  roleTitle,
  teamName,
  postingHref,
  sender,
  draft,
  onDraftChange,
  onSend,
}: Props) {
  const first = personName.split(' ')[0];
  const senderFirst = sender.name.split(' ')[0];
  const senderRole = sender.role;
  /* Merged from three drafts (warm, concise, role-forward), 2026-10-13. Says
     once that they didn't apply and why they came up, makes one ask, and makes
     "no" cost one line. "Our <role> role" so any title reads right. No
     why-you sentence: the line above the box asks the lead to add their own. */
  const template = `Hi ${first},

I'm ${senderFirst}, ${senderRole} at ${teamName}. I'm hiring for our ${roleTitle} role. You didn't apply; you came up because you let hiring teams in the network find you.

If the role sounds worth a look, would you be open to a 20-minute call in the next couple of weeks? The posting is attached. If the timing or the role isn't right, a one-line no is completely fine.

Thanks,
${senderFirst}`;

  const methods = useForm<{ message: string }>({ defaultValues: { message: draft ?? template } });
  const message = useWatch({ control: methods.control, name: 'message' }) ?? '';
  const edited = message !== template;

  // A fresh form per person and per opening, seeded from the kept draft.
  useEffect(() => {
    if (open) methods.reset({ message: draft ?? template });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personName]);

  useEffect(() => {
    if (open) onDraftChange(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={ideaModalStyles.root}>
        <div className={dealModalStyles.header}>
          <div className={dealModalStyles.headerText}>
            <h2 className={dealModalStyles.title}>Contact {first}</h2>
            <p className={dealModalStyles.subtitle}>
              About{' '}
              {postingHref ? (
                <a href={postingHref} target="_blank" rel="noopener noreferrer" className={s.roleLink}>
                  {roleTitle}
                  <ArrowUpRightIcon width={12} height={12} />
                </a>
              ) : (
                roleTitle
              )}{' '}
              at {teamName}
            </p>
          </div>
          <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <FormProvider {...methods}>
          <div className={dealModalStyles.content}>
            {/* The application step's lede, from the lead's side. */}
            <p className={`${pd.lede} ${s.lede}`}>{first} receives your profile and this email. Replies come back to you.</p>

            <div className={ap.body}>
              {/* The lead as the member will see them: one compact card. (The
                  application's full read-back was tried here and reverted —
                  a founder introducing themselves needs a face and a title,
                  not dates and skill chips.) */}
              <div className={ap.block}>
                <p className={dsh.title}>{first} will see your profile</p>
                <DetailsSectionGreyContentContainer>
                  <div className={s.sender}>
                    <img className={s.senderAvatar} src={sender.avatar} alt="" width={40} height={40} />
                    <div className={s.senderText}>
                      <span className={s.senderName}>{sender.name}</span>
                      <span className={s.senderRole}>
                        {sender.role} · {teamName}
                      </span>
                    </div>
                  </div>
                </DetailsSectionGreyContentContainer>
              </div>

              <div className={refer.templateBlock}>
                <div className={refer.templateLabelRow}>
                  <span className={refer.templateLabel}>Email to {first}</span>
                  {edited && (
                    <button type="button" className={refer.resetLink} onClick={() => methods.setValue('message', template)}>
                      Reset to template
                    </button>
                  )}
                </div>
                <p id="contact-description" className={`${taCss.fieldDescription} ${taCss.fieldDescriptionTop}`}>
                  Say what caught your eye in {first}’s profile
                </p>
                <FormTextArea
                  name="message"
                  placeholder=""
                  aria-describedby="contact-description"
                  rows={12}
                  maxLength={MESSAGE_MAX_LENGTH}
                  showCharCount
                />
              </div>
            </div>
          </div>
        </FormProvider>

        <div className={dealModalStyles.footer}>
          <div className={s.footerActions}>
            <Button style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!message.trim()} onClick={() => onSend(message.trim())}>
              Send email
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
