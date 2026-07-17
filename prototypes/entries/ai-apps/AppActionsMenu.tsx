'use client';

import { useEffect, useRef, useState } from 'react';

import { MenuIcon } from '@/components/icons';

import s from './AppActionsMenu.module.scss';

interface Props {
  /** Called when "Edit details…" is chosen. */
  onEdit: () => void;
  /** Called when "Deployment settings…" is chosen. */
  onDeployment: () => void;
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
export function AppActionsMenu({ onEdit, onDeployment, onDelete, appName }: Props) {
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
            Edit details
          </button>
          <button type="button" role="menuitem" className={s.item} onClick={runAndClose(onDeployment)}>
            Deployment settings
          </button>
          <div className={s.divider} role="separator" />
          <button
            type="button"
            role="menuitem"
            className={`${s.item} ${s.destructive}`}
            onClick={runAndClose(onDelete)}
          >
            Delete app
          </button>
        </div>
      )}
    </div>
  );
}
