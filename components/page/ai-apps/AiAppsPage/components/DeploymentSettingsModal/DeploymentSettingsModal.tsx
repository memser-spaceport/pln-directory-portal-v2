'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CloseIcon, SuccessCircleIcon } from '@/components/icons';
import { AiApp, deployAiApp } from '@/services/ai-apps/ai-apps.service';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import s from './DeploymentSettingsModal.module.scss';

type Phase = 'form' | 'deploying' | 'done';

interface Props {
  app: AiApp;
  onClose: () => void;
}

/**
 * Deployment settings from the list card: update/replace secrets and
 * redeploy. Secrets are write-only — a stored value can never be read back,
 * so a provided var shows as masked "Stored" until the creator chooses to
 * Replace it, and leaving it stored means "keep the stored value". Apps with
 * no secrets can still redeploy (plain restart of the stored bundle).
 *
 * Env var NAMES are snapshotted at mount: the post-deploy poll updates the
 * live record, and rows must not remount/lock mid-keystroke under the user.
 * Only `status` is read live, to drive the deploying → done/failed phases.
 */
export function DeploymentSettingsModal({ app, onClose }: Props) {
  const analytics = useAiAppsAnalytics();
  const queryClient = useQueryClient();

  // Mount-time snapshots (the component renders only while open).
  const [requiredEnvVars] = useState(() => app.requiredEnvVars);
  const [provided] = useState(() => new Set(app.providedEnvVars));

  const [values, setValues] = useState<Record<string, string>>({});
  // Stored vars the creator has chosen to replace (revealing an empty input).
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set once the live record is seen DEPLOYING after our POST — guards the
  // done-transition against a stale READY still sitting in the cache.
  const [deployObserved, setDeployObserved] = useState(false);

  // Live record: fresh canManage/status, and the 5s poll while DEPLOYING.
  const { app: liveApp } = useAiApp(app.uid);
  const liveStatus = liveApp?.status ?? app.status;
  const liveNotes = liveApp?.notes ?? null;

  const isDraft = app.status === 'DRAFT';
  const hasSecrets = requiredEnvVars.length > 0;
  // A deploy already running that this modal didn't start (e.g. agent-triggered).
  const externalDeployInFlight = phase === 'form' && liveStatus === 'DEPLOYING';

  useEffect(() => {
    analytics.onDeploymentSettingsOpened({ appUid: app.uid, isDraft });
    // Open-event only — analytics identity is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'deploying') return;
    if (liveStatus === 'DEPLOYING') {
      setDeployObserved(true);
      return;
    }
    if (!deployObserved) return;
    if (liveStatus === 'READY') {
      setPhase('done');
    } else if (liveStatus === 'ERROR') {
      setPhase('form');
      setDeployObserved(false);
      setError(liveNotes ? `Deploy failed: ${liveNotes}` : 'Deploy failed. Please try again.');
    }
  }, [phase, liveStatus, deployObserved, liveNotes]);

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const startReplace = (name: string) => setReplacing((prev) => ({ ...prev, [name]: true }));

  const cancelReplace = (name: string) => {
    setReplacing((prev) => ({ ...prev, [name]: false }));
    setValues((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleRedeploy = async () => {
    if (isSubmitting || externalDeployInFlight) return;

    const secrets: Record<string, string> = {};
    for (const [name, value] of Object.entries(values)) {
      if (value.trim()) {
        secrets[name] = value.trim();
      }
    }

    const missing = requiredEnvVars.filter((name) => !provided.has(name) && !secrets[name]);
    if (missing.length) {
      setError(`Enter a value for: ${missing.join(', ')}`);
      return;
    }

    const willProvide = new Set(provided);
    Object.keys(secrets).forEach((name) => willProvide.add(name));

    setError(null);
    setIsSubmitting(true);
    analytics.onSecretsDeployClicked({
      appUid: app.uid,
      isDraft,
      varsRequiredCount: requiredEnvVars.length,
      varsProvidedCount: requiredEnvVars.filter((name) => willProvide.has(name)).length,
    });

    const result = await deployAiApp(app.uid, secrets);

    if (result.error) {
      // Keep typed values so the user can fix and retry without re-entering.
      setError(result.error);
      setIsSubmitting(false);
      analytics.onSecretsDeployFailed({ appUid: app.uid, isDraft });
      return;
    }

    analytics.onSecretsDeploySucceeded({ appUid: app.uid, isDraft });
    setValues({});
    setReplacing({});
    // Refresh both caches right away — the list poll only starts once it can
    // see a DEPLOYING app, and the detail query drives this modal's phases.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, app.uid] }),
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
    ]);
    setIsSubmitting(false);
    setPhase(result.app?.status === 'DEPLOYING' ? 'deploying' : 'done');
  };

  return (
    <Modal isOpen onClose={onClose} className={s.modal}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Deployment settings</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {phase === 'form' && (
          <>
            <div className={s.body}>
              {hasSecrets ? (
                <>
                  <p className={s.intro}>
                    Update one or more values and redeploy. Stored secrets stay in place — replace one only if it
                    changed. Secrets are held securely on the sandbox and never shown again.
                  </p>
                  <div className={s.fields}>
                    {requiredEnvVars.map((name) => {
                      const isStored = provided.has(name);
                      const showStored = isStored && !replacing[name];
                      return (
                        <div key={name} className={s.field}>
                          <span className={s.fieldName}>
                            {name}
                            {isStored ? (
                              <span className={s.storedTag}>Stored</span>
                            ) : (
                              <span className={s.requiredTag}>Required</span>
                            )}
                          </span>
                          {showStored ? (
                            <div className={s.storedRow}>
                              <span className={s.maskedValue} aria-label="Stored secret value">
                                ••••••••••••••••
                              </span>
                              <button
                                type="button"
                                className={s.linkBtn}
                                onClick={() => startReplace(name)}
                                disabled={isSubmitting}
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <div className={s.editRow}>
                              <input
                                className={s.input}
                                type="password"
                                // Keeps browsers/password managers from treating
                                // these as login fields (and PostHog replay masks
                                // password inputs unconditionally).
                                autoComplete="new-password"
                                value={values[name] ?? ''}
                                placeholder={isStored ? 'Enter a new value' : 'Enter a value'}
                                onChange={(e) => onChange(name, e.target.value)}
                                disabled={isSubmitting}
                              />
                              {isStored && (
                                <button
                                  type="button"
                                  className={s.linkBtn}
                                  onClick={() => cancelReplace(name)}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className={s.intro}>
                  This app has no secrets to configure. Redeploy to restart the sandbox and pull the latest deployment.
                </p>
              )}

              {externalDeployInFlight && <p className={s.intro}>A deploy is already in progress for this app.</p>}
              {error && <p className={s.error}>{error}</p>}
            </div>

            <div className={s.footer}>
              <Button style="border" variant="neutral" size="s" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                style="fill"
                variant="primary"
                size="s"
                onClick={handleRedeploy}
                disabled={isSubmitting || externalDeployInFlight}
              >
                {isSubmitting ? 'Redeploying…' : 'Redeploy'}
              </Button>
            </div>
          </>
        )}

        {phase === 'deploying' && (
          <div className={s.statusBody}>
            <Spinner />
            <p className={s.statusTitle}>Redeploying {app.name}</p>
            <p className={s.statusText}>
              This usually takes a couple of minutes — you can close this and keep working.
            </p>
          </div>
        )}

        {phase === 'done' && (
          <>
            <div className={s.statusBody}>
              <SuccessCircleIcon width={44} height={44} className={s.successMark} aria-hidden />
              <p className={s.statusTitle}>App redeployed</p>
              <p className={s.statusText}>Your changes are live. Open the app to see the latest version.</p>
            </div>
            <div className={s.footer}>
              <Button style="fill" variant="primary" size="s" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
