'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';

import { APP_OPTIONS, MOCK_MEMBER } from './mocks';
import s from './FeedbackDrawer.module.scss';

export type DrawerMode = 'feedback' | 'bug';

/** The parent mounts the drawer on each open, so each open starts a new form. */
interface Props {
  open: boolean;
  mode: DrawerMode;
  onModeChange: (mode: DrawerMode) => void;
  onClose: () => void;
  signedIn: boolean;
  /** The AI Apps list page: the drawer shows the app picker, on "AI Apps". */
  aiAppsList: boolean;
  /** The page path for the context line. */
  pagePath: string;
}

const COPY: Record<DrawerMode, { title: string; placeholder: string; done: string }> = {
  feedback: {
    title: 'Give feedback',
    placeholder: 'What worked, what didn’t, and what would make this more useful?',
    done: 'Thank you. We got your feedback.',
  },
  bug: {
    title: 'Report a bug',
    placeholder: 'What happened? What did you expect to happen?',
    done: 'Thank you. We got your bug report.',
  },
};

/**
 * A copy-simplified feedback drawer (production: GiveAiAppFeedbackDialog, as the
 * ai-apps-feedback-drawer prototype shows it). Kept: the right-side drawer at
 * 480px (full screen on phones), the page screenshot, the message.
 * Simplified: the annotator, drafts, pins and comments are not here.
 * New: the "Report a bug" mode (LAB-2883), name and email when signed out (LAB-2882),
 * and the app picker on the AI Apps list page (LAB-2885).
 */
export function FeedbackDrawer({ open, mode, onModeChange, onClose, signedIn, aiAppsList, pagePath }: Props) {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [app, setApp] = useState(APP_OPTIONS[0]);
  const [screenshot, setScreenshot] = useState(true);
  const [state, setState] = useState<'edit' | 'sending' | 'sent'>('edit');
  // From 960px the drawer starts under the header, wherever the page put the header.
  const [top] = useState(() => {
    if (typeof window === 'undefined' || window.innerWidth < 960) return 0;
    return Math.max(0, document.querySelector('[data-feedback-header]')?.getBoundingClientRect().bottom ?? 0);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copy = COPY[mode];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSend = message.trim().length > 0 && (signedIn || (name.trim().length > 0 && emailOk));

  const send = () => {
    setState('sending');
    window.setTimeout(() => setState('sent'), 800);
  };

  return (
    <div className={s.scrim} style={{ top }} onClick={onClose}>
      <aside
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.head}>
          <h2 className={s.title}>{copy.title}</h2>
          <button type="button" className={s.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {state === 'sent' ? (
          <div className={s.done}>
            <p className={s.doneText}>{copy.done}</p>
            <p className={s.meta}>
              {signedIn ? `We reply to ${MOCK_MEMBER.email} if we have a question.` : `We reply to ${email}.`}
            </p>
            <button type="button" className={s.primary} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className={s.body}>
              <div className={s.switch} role="tablist" aria-label="Type">
                {(['feedback', 'bug'] as DrawerMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    className={clsx(s.switchBtn, mode === m && s.switchBtnActive)}
                    onClick={() => onModeChange(m)}
                  >
                    {COPY[m].title}
                  </button>
                ))}
              </div>

              {aiAppsList && signedIn && (
                <label className={s.field}>
                  <span className={s.fieldLabel}>Which app is it about?</span>
                  <select className={s.input} value={app} onChange={(e) => setApp(e.target.value)}>
                    {APP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!signedIn && (
                <div className={s.row}>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Name</span>
                    <input
                      className={s.input}
                      value={name}
                      placeholder="Your name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Email</span>
                    <input
                      className={s.input}
                      type="email"
                      value={email}
                      placeholder="you@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                </div>
              )}

              <label className={s.field}>
                <span className={s.fieldLabel}>{mode === 'bug' ? 'What went wrong?' : 'Your feedback'}</span>
                <textarea
                  className={clsx(s.input, s.textarea)}
                  value={message}
                  placeholder={copy.placeholder}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <div className={s.field}>
                <span className={s.fieldLabel}>Screenshot</span>
                {screenshot ? (
                  <div className={s.shot}>
                    {/* A drawn stand-in for the capture of the page under the drawer. */}
                    <div className={s.shotImage} aria-label="Screenshot of this page">
                      <span className={s.shotBar} />
                      <span className={s.shotLine} />
                      <span className={clsx(s.shotLine, s.shotLineShort)} />
                      <span className={s.shotGrid}>
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                    <div className={s.shotInfo}>
                      <span className={s.meta}>This page: {pagePath}</span>
                      <button type="button" className={s.link} onClick={() => setScreenshot(false)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={s.secondary} onClick={() => setScreenshot(true)}>
                    Add a screenshot of this page
                  </button>
                )}
              </div>

              <p className={s.meta}>
                {aiAppsList && signedIn ? `About: ${app}. ` : 'About: LabOS. '}
                The page link goes with your message.
              </p>
            </div>

            <div className={s.foot}>
              <button type="button" className={s.secondary} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={s.primary} disabled={!canSend || state === 'sending'} onClick={send}>
                {state === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
