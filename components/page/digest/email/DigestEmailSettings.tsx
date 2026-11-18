'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { type DigestEmailAction, digestEmailLinkType, useDigestEmailAnalytics } from '@/analytics/digest.analytics';
import { Button } from '@/components/common/Button';
import { saveDigestEmailSettings } from '@/services/digest/digest.service';
import type {
  DigestEmailSettings as Settings,
  DigestEmailSettingsChange,
  DigestFrequency,
} from '@/services/digest/digest.types';

import s from './DigestEmailSettings.module.scss';

type Props = {
  token: string;
  initial: Settings;
  /** The footer link's `link_type` and `to`: they pick the main button and never change anything on their own. */
  linkType: string | null;
  to: string | null;
  isLoggedIn: boolean;
};

type Via = 'main-button' | 'controls';

/** A saved change, kept for Undo: the settings before it and what kind of change it was. */
type Done = { action: DigestEmailAction; before: Settings };

const EVERY: Record<DigestFrequency, string> = { daily: 'every day', weekly: 'every week' };

function actionOf(before: Settings, after: Settings): DigestEmailAction {
  if (before.enabled && !after.enabled) return 'unsubscribe';
  if (!before.enabled && after.enabled) return 'resubscribe';
  return 'frequency';
}

function confirmationOf(done: Done, now: Settings): string {
  if (done.action === 'unsubscribe') return 'You’re unsubscribed from the digest.';
  if (done.action === 'resubscribe') return `Your digest is back on. It comes ${EVERY[now.frequency]}.`;
  return `Your digest is now ${now.frequency}.`;
}

/** Only the fields that differ, so a save never rewrites a setting the reader didn't touch. */
function diff(from: Settings, to: Pick<Settings, 'enabled' | 'frequency'>): DigestEmailSettingsChange {
  const change: DigestEmailSettingsChange = {};
  if (from.enabled !== to.enabled) change.enabled = to.enabled;
  if (from.frequency !== to.frequency) change.frequency = to.frequency;
  return change;
}

/**
 * The digest email page (LAB-3309, LAB-3312): the reader's digest email from the email footer, without sign-in.
 * The footer link only chooses the main button; nothing is saved until a press, because mail scanners open links.
 */
export function DigestEmailSettings({ token, initial, linkType, to, isLoggedIn }: Props) {
  const analytics = useDigestEmailAnalytics();
  const [settings, setSettings] = useState(initial);
  const [done, setDone] = useState<Done | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<(() => void) | null>(null);

  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    analytics.onPageViewed({
      linkType: digestEmailLinkType(linkType),
      enabled: initial.enabled,
      frequency: initial.frequency,
      isLoggedIn,
    });
  }, [analytics, initial, isLoggedIn, linkType]);

  const save = async (target: Pick<Settings, 'enabled' | 'frequency'>, via: Via) => {
    const change = diff(settings, target);
    if (saving || Object.keys(change).length === 0) return;
    const before = settings;
    const action = actionOf(before, { ...before, ...target });
    setSaving(true);
    setFailed(null);
    try {
      const after = await saveDigestEmailSettings(token, change);
      setSettings(after);
      setDone({ action, before });
      analytics.onChanged({ action, frequency: after.frequency, via });
    } catch {
      setFailed(() => () => save(target, via));
      analytics.onSaveFailed({ action });
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    if (!done || saving) return;
    const change = diff(settings, done.before);
    setSaving(true);
    setFailed(null);
    try {
      setSettings(Object.keys(change).length ? await saveDigestEmailSettings(token, change) : settings);
      analytics.onUndoClicked({ reverted: done.action });
      setDone(null);
    } catch {
      setFailed(() => undo);
      analytics.onSaveFailed({ action: 'undo' });
    } finally {
      setSaving(false);
    }
  };

  const wanted: DigestFrequency | null =
    linkType === 'switch_frequency' && (to === 'daily' || to === 'weekly') ? to : null;

  // The footer's request, as the main button, or a note when it already holds.
  let note: string | null = null;
  let main: { label: string; target: Pick<Settings, 'enabled' | 'frequency'> } | null = null;
  if (linkType === 'unsubscribe') {
    if (settings.enabled) main = { label: 'Unsubscribe', target: { enabled: false, frequency: settings.frequency } };
    else {
      note = 'You’re already unsubscribed from the digest.';
      main = { label: 'Turn the digest back on', target: { enabled: true, frequency: settings.frequency } };
    }
  } else if (wanted) {
    if (!settings.enabled) {
      note = 'The digest is off.';
      main = { label: `Turn on the ${wanted} digest`, target: { enabled: true, frequency: wanted } };
    } else if (settings.frequency === wanted) note = `Your digest is already ${wanted}.`;
    else main = { label: `Switch to ${wanted}`, target: { enabled: true, frequency: wanted } };
  }

  return (
    <div className={s.page}>
      <main className={s.card}>
        <h1 className={s.title}>Your digest email</h1>
        <p className={s.text}>
          {settings.firstName && <>Hi {settings.firstName}. </>}
          {settings.enabled
            ? `You get the LabOS digest ${EVERY[settings.frequency]}.`
            : 'You don’t get the LabOS digest by email.'}
        </p>

        <div aria-live="polite">
          {done ? (
            <div className={s.confirmation} role="status">
              <span>{confirmationOf(done, settings)}</span>
              <Button size="s" style="border" variant="neutral" disabled={saving} onClick={undo}>
                Undo
              </Button>
            </div>
          ) : (
            (note || main) && (
              <div className={s.request}>
                {note && <p className={s.note}>{note}</p>}
                {main && (
                  // The reader came for this change, so it is the page's one primary button.
                  <Button size="m" variant="primary" disabled={saving} onClick={() => save(main.target, 'main-button')}>
                    {main.label}
                  </Button>
                )}
              </div>
            )
          )}
          {failed && (
            <p className={s.error} role="alert">
              We couldn’t save that.{' '}
              <button type="button" className={s.inlineLink} onClick={failed} disabled={saving}>
                Try again
              </button>
            </p>
          )}
        </div>

        <fieldset className={s.controls} disabled={saving}>
          <legend className={s.srOnly}>Digest email settings</legend>
          <div className={s.row}>
            <span className={s.rowLabel} id="digest-email-on">
              Digest email
            </span>
            <div className={s.segmented} role="group" aria-labelledby="digest-email-on">
              {[true, false].map((on) => (
                <button
                  key={String(on)}
                  type="button"
                  className={clsx(s.segment, settings.enabled === on && s.segmentOn)}
                  aria-pressed={settings.enabled === on}
                  onClick={() => save({ enabled: on, frequency: settings.frequency }, 'controls')}
                >
                  {on ? 'On' : 'Off'}
                </button>
              ))}
            </div>
          </div>
          <div className={s.row}>
            <span className={s.rowLabel} id="digest-email-frequency">
              How often
            </span>
            <div className={s.segmented} role="group" aria-labelledby="digest-email-frequency">
              {(['daily', 'weekly'] as const).map((frequency) => (
                <button
                  key={frequency}
                  type="button"
                  className={clsx(s.segment, settings.frequency === frequency && s.segmentOn)}
                  aria-pressed={settings.frequency === frequency}
                  disabled={!settings.enabled}
                  onClick={() => save({ enabled: true, frequency }, 'controls')}
                >
                  {frequency === 'daily' ? 'Daily' : 'Weekly'}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <nav className={s.links} aria-label="More">
          <Link href={`/digest?t=${encodeURIComponent(token)}`} className={s.link}>
            Read your digest
          </Link>
          <Link href="/settings/email" className={s.link}>
            All email preferences →
          </Link>
        </nav>
      </main>
    </div>
  );
}
