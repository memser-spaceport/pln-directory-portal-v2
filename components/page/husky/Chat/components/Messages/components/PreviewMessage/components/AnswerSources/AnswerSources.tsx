import { Popover } from '@base-ui-components/react/popover';

import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

import { sourceItems } from '@/components/utils/sourceItems';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import { ArrowUpRightIcon } from '@/components/icons';

import s from './AnswerSources.module.scss';

interface Props {
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
}

const DIRECTORY_KINDS: Record<string, string> = {
  members: 'Member',
  teams: 'Team',
  projects: 'Project',
  events: 'Event',
  irl: 'Event',
  forum: 'Forum post',
  home: 'News',
};

// The grey line under a source's title: a directory record's kind, or the site an outside page lives on.
function originOf(href: string) {
  if (href.startsWith('/')) {
    return DIRECTORY_KINDS[href.split(/[/?]/)[1]] ?? 'Directory';
  }
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export const AnswerSources = (props: Props) => {
  const { sources, sourceRefs } = props;

  const { trackHuskySourceLinkClicked } = useHuskyAnalytics();
  const items = sourceItems(sources, sourceRefs);

  if (items.length === 0) {
    return null;
  }

  return (
    <Popover.Root>
      <Popover.Trigger className={s.pill}>
        <span className={s.stack} aria-hidden="true">
          {items.slice(0, 3).map((item) => (
            <span key={item.key} className={s.mark}>
              {item.title.charAt(0)}
            </span>
          ))}
        </span>
        {items.length} {items.length === 1 ? 'source' : 'sources'}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} side="top" align="end" sideOffset={6}>
          <Popover.Popup className={s.popup}>
            <Popover.Title className={s.title}>Sources</Popover.Title>
            <ul className={s.list}>
              {items.map((item) => (
                <li key={item.key}>
                  <a
                    className={s.row}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackHuskySourceLinkClicked(item.href)}
                  >
                    <span className={s.mark} aria-hidden="true">
                      {item.title.charAt(0)}
                    </span>
                    <span className={s.text}>
                      <span className={s.rowTitle}>{item.title}</span>
                      <span className={s.origin}>{originOf(item.href)}</span>
                    </span>
                    <ArrowUpRightIcon className={s.out} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
