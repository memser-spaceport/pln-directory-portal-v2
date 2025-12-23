import {
  ArrowsInCardinalIcon,
  FolderIcon,
  HandsPrayingIcon,
  NotePencilIcon,
  PencilSimpleLineIcon,
  PushPinIcon,
  QuestionCircleStrokeIcon,
} from '@/components/icons';
import { ModalBase } from '@/components/common/ModalBase';

import { SingleTip } from './components/SingleTip';

import s from './PostTipsModal.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PostTipsModal(props: Props) {
  const { open, onClose } = props;

  return (
    <ModalBase
      title="Tips to write a great post"
      titleIcon={<NotePencilIcon />}
      open={open}
      onClose={onClose}
      submit={{
        label: 'Got it',
        onClick: onClose,
        className: s.submit,
      }}
    >
      <div className={s.subtitle}>
        Great posts get better answers.
        <br />
        Follow these guidelines to help others give you useful, thoughtful responses.
      </div>
      <section className={s.tips}>
        <div className={s.tipsTitle}>Make Your Post Effective</div>

        <div className={s.tipsList}>
          <SingleTip Icon={PencilSimpleLineIcon} title="Write a specific title.">
            Compare &quot;Need help&quot; vs &quot;How to price B2B SaaS for mid-market customers?&quot; — the second
            one immediately tells people what you&apos;re asking.
          </SingleTip>

          <SingleTip Icon={PushPinIcon} title="Provide context.">
            Share your stage, industry, what you&apos;ve tried, and any constraints. The more context, the better the
            responses.
          </SingleTip>

          <SingleTip Icon={QuestionCircleStrokeIcon} title="Ask one main question.">
            Focus each post on a single topic for clearer, more useful discussion.
          </SingleTip>

          <SingleTip Icon={ArrowsInCardinalIcon} title="Be specific about what you need.">
            Are you looking for tactical advice, introductions, validation, or general perspectives?
          </SingleTip>

          <SingleTip Icon={FolderIcon} title="Choose the right topic:">
            <ul className={s.topicsList}>
              <li>• General — Most asks and knowledge sharing</li>
              <li>• Launch — New product launches only</li>
              <li>• Talent — Hiring roles or recommending candidates</li>
              <li>• Intros — Warm introduction requests (be specific about who and why)</li>
            </ul>
          </SingleTip>

          <SingleTip Icon={HandsPrayingIcon} title="Communication.">
            Thank people who help you. Share back. When you get helpful responses, circle back later to share what you
            decided and how it worked out.
          </SingleTip>
        </div>
      </section>
    </ModalBase>
  );
}
