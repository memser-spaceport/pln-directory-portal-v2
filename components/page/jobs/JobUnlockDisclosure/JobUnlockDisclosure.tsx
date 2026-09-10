'use client';

import clsx from 'clsx';
import { Dialog } from '@base-ui-components/react/dialog';
import { Popover } from '@base-ui-components/react/popover';

import { CloseIcon, InfoCircleIconOutlined } from '@/components/icons';
import { useIsMobile } from '@/hooks/useIsMobile';

import { UNLOCK_TITLE, UNLOCK_TRIGGER_LABEL } from '@/components/page/jobs/JobUnlock/unlockCopy';
import { UnlockItems } from '@/components/page/jobs/JobUnlock/UnlockItems';

import s from './JobUnlockDisclosure.module.scss';

const TITLE_ID = 'job-unlock-disclosure-title';

/** Which shape the disclosure took, for the analytics event. */
export type UnlockDisclosureSurface = 'popover' | 'modal';

interface Props {
  className?: string;
  /**
   * Fired when the disclosure opens, never when it closes.
   *
   * The caller owns the job and team params — this component has no idea what a
   * job is, and should not learn.
   */
  onOpened?: (surface: UnlockDisclosureSurface) => void;
}

/**
 * "What your profile unlocks?" — the control under the apply drawer's primary
 * button, and the two reasons it reveals.
 *
 * **What it replaced.** A static caption reading "~2 min · team is notified you
 * are interested", which had three problems: it promised a notification this
 * branch does not send (the press opens an account and comes back; applying
 * still happens on the employer's site), it spent the slot on a claim rather
 * than on the argument, and at 12px `#8897ae` it sat around 3.0:1 — under AA, and
 * documented in the stylesheet as a knowing tradeoff. The design's answer is a
 * control instead of a caption, at 14px `#455468`, which clears AA as a side
 * effect.
 *
 * **Two presentations, one trigger.** Figma opens a popover on hover at desktop
 * width (682:10187) and a centered modal on tap on a phone (682:11240). The split
 * is `useIsMobile`, the same 768px hook that already decides whether the drawer
 * itself goes full-screen — so the disclosure changes shape at exactly the width
 * the thing containing it does.
 *
 * **Hover is the design; the button is for everyone else.** `openOnHover` gets
 * the frame's interaction. Because the trigger is a real `<button>`, keyboard
 * users get the same content on Enter/Space, and so does anyone on a touch device
 * wide enough to miss the mobile branch — a tablet between 768px and 1024px has
 * no hover at all, and a hover-only affordance there would simply be dead.
 *
 * **Neither root is controlled.** Base UI then owns Esc, outside-click dismissal
 * and — for the dialog — returning focus to the trigger on close.
 * `FounderMethodologyModal` controls `open` itself and has to restore focus by
 * hand for that reason; nothing outside this component needs to open it, so there
 * is no reason to repeat that here.
 */
export function JobUnlockDisclosure({ className, onOpened }: Props) {
  const isMobile = useIsMobile();

  /* The trigger's innards, shared by both wrappers. Two copies of an icon and a
     label is exactly the kind of thing that drifts, and this is the one part of
     the component a person actually looks at. */
  const label = (
    <>
      {/* Explicit size: the icon's intrinsic box is 18px and the design's is 14. */}
      <InfoCircleIconOutlined width={14} height={14} aria-hidden="true" />
      {UNLOCK_TRIGGER_LABEL}
    </>
  );

  if (isMobile) {
    return (
      <Dialog.Root onOpenChange={(next) => next && onOpened?.('modal')}>
        <Dialog.Trigger className={clsx(s.trigger, className)}>{label}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className={s.backdrop} />
          <Dialog.Popup className={s.modal} aria-labelledby={TITLE_ID}>
            <div className={s.modalHeader}>
              {/* `render` because `Dialog.Title` is an `<h2>` by default, and a
                  second element named "What your profile unlocks" would give the
                  document two headings with one name — see the note on the
                  popover's title below. The `render` prop keeps Base UI's
                  labelling wiring and changes only the element. */}
              <Dialog.Title render={<p />} id={TITLE_ID} className={s.title}>
                {UNLOCK_TITLE}
              </Dialog.Title>
              <Dialog.Close className={s.close} aria-label="Close">
                <CloseIcon width={16} height={16} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <UnlockItems size="compact" />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Popover.Root
      openOnHover
      /* 150ms, not the 300ms default. This is a caption-sized affordance beside a
         button; a third of a second after a deliberate hover reads as broken. */
      delay={150}
      closeDelay={100}
      onOpenChange={(next) => next && onOpened?.('popover')}
    >
      <Popover.Trigger className={clsx(s.trigger, className)}>{label}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} side="top" align="end" sideOffset={6}>
          <Popover.Popup className={s.popup} aria-labelledby={TITLE_ID}>
            {/* NOT `Popover.Title`, which renders an `<h2>`. `JobUnlockBanner`
                already puts a heading with these exact words on the same screen,
                and a second one would break the assertion that finds it — as well
                as announcing the same heading twice to a screen reader walking the
                page. `aria-labelledby` names the popup without claiming to be a
                landmark. Do not "restore" `Popover.Title` here. */}
            <p id={TITLE_ID} className={s.title}>
              {UNLOCK_TITLE}
            </p>
            <UnlockItems size="compact" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
