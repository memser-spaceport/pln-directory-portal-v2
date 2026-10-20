import { clsx } from 'clsx';

import { CommentIcon } from '@/components/icons';

import { useShortcutLabels } from '../../shortcutKeys';
import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '../screenshot-feedback/capturePage';
import { useIntroCollapse } from './hooks/useIntroCollapse';

import s from './FeedbackFabButton.module.scss';

interface Props {
  name: string;
  isDrawerOpen: boolean;
  /** The feedback form hid itself for a screenshot: the button steps out of the picture with it. */
  isHidden: boolean;
  onClick: () => void;
  /** Shown on the resting mark when above zero. */
  count?: number;
}

/**
 * Opens saying its name, then settles into a 48px glyph in the bottom-right corner. After that,
 * a hover-capable pointer (or keyboard focus) can expand the label again; on touch it stays the
 * glyph. On the AI app detail page everything the control covers belongs to the embedded app,
 * so the resting state has to be the smallest mark that can still be found.
 */
export function FeedbackFabButton(props: Props) {
  const { name, isDrawerOpen, isHidden, onClick, count } = props;
  const shortcuts = useShortcutLabels();
  const isCollapsed = useIntroCollapse(isDrawerOpen);

  return (
    /* The button steps aside while its drawer is open, at every width; ✕ and Esc bring it back. */
    <div
      {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '' }}
      className={clsx(s.wrap, isHidden && s.wrapHidden, isDrawerOpen && s.fabHidden)}
      data-collapsed={isCollapsed || isDrawerOpen}
      aria-hidden={isDrawerOpen || undefined}
    >
      <button
        type="button"
        className={s.button}
        aria-label={name}
        aria-keyshortcuts={shortcuts.openAria}
        tabIndex={isDrawerOpen ? -1 : undefined}
        onClick={onClick}
      >
        {/* CommentIcon hardcodes its own 16px box and ignores props. */}
        <CommentIcon />
        <span className={s.label} aria-hidden>
          <span>{name}</span>
          <kbd className={s.labelKbd}>{shortcuts.open}</kbd>
        </span>
        {count !== undefined && count > 0 && (
          <span className={s.count} aria-label={`${count} comments`}>
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
