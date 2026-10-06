'use client';

import { useEffect, useRef, useState } from 'react';

import { MenuIcon } from '@/components/icons';

import s from './AppActionsMenu.module.scss';

/**
 * A matched 16px stroke set, local to the prototype. The shared icon library
 * has no gear or trash, and its two nearest icons disagree on style (EditIcon
 * is a solid fill, DocumentIcon a 1.2px outline) — mixing them would read as
 * two different sets in one menu. These inherit `currentColor`, so the
 * destructive item tints its icon for free.
 */
const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function PencilIcon() {
  return (
    <svg {...iconProps}>
      <path d="M11.06 2.94a1.5 1.5 0 0 1 2.12 2.12l-7.42 7.42-2.83.71.71-2.83 7.42-7.42Z" />
      <path d="M10.25 3.75l2.12 2.12" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M5 7l1.8 1.8L5 10.6" />
      <path d="M8.8 10.6h2.4" />
    </svg>
  );
}

/**
 * A log file: a document carrying text lines. The card's "App Details" doc icon
 * is the same silhouette without the lines, which is what keeps the two apart.
 */
function LogFileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4.5 2h4.7L12.5 5.3V13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M9 2v3.5h3.5" />
      <path d="M5.9 8.9h4.2M5.9 11h2.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 4.5h10" />
      <path d="M6.5 4.5v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1" />
      <path d="M4.6 4.5l.55 8a1 1 0 0 0 1 .93h3.7a1 1 0 0 0 1-.93l.55-8" />
      <path d="M6.8 7v3.8M9.2 7v3.8" />
    </svg>
  );
}

interface Props {
  /** Called when "Edit details…" is chosen. */
  onEdit: () => void;
  /** Called when "Deployment settings…" is chosen. */
  onDeployment: () => void;
  /** Called when "Deployment logs…" is chosen. */
  onLogs: () => void;
  /** Called when "Delete app" is chosen. */
  onDelete: () => void;
  appName: string;
}

/**
 * The kebab (⋯) "more actions" menu that houses every creator-only action for
 * an app: edit details, deployment settings, and delete. It is only a router —
 * each item opens its own focused surface, so the destructive delete stays
 * isolated from the edit form and the slow redeploy flow.
 */
export function AppActionsMenu({ onEdit, onDeployment, onLogs, onDelete, appName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while open.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const runAndClose = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className={s.root}>
      <button
        type="button"
        className={s.trigger}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`More actions for ${appName}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <MenuIcon width={20} height={20} color="#455468" />
      </button>

      {isOpen && (
        <div className={s.menu} role="menu">
          <button type="button" role="menuitem" className={s.item} onClick={runAndClose(onEdit)}>
            <PencilIcon />
            Edit details
          </button>
          <button type="button" role="menuitem" className={s.item} onClick={runAndClose(onDeployment)}>
            <TerminalIcon />
            Deployment settings
          </button>
          <button type="button" role="menuitem" className={s.item} onClick={runAndClose(onLogs)}>
            <LogFileIcon />
            Deployment logs
          </button>
          <div className={s.divider} role="separator" />
          <button
            type="button"
            role="menuitem"
            className={`${s.item} ${s.destructive}`}
            onClick={runAndClose(onDelete)}
          >
            <TrashIcon />
            Delete app
          </button>
        </div>
      )}
    </div>
  );
}
