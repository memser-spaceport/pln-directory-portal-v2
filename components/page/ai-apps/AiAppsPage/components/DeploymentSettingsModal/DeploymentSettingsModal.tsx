'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CloseIcon, SuccessCircleIcon } from '@/components/icons';
import {
  AiApp,
  AiAppDeployKeySummary,
  AiAppTargetEnvironment,
  aiAppStatusLabel,
  aiAppTarget,
  createAiAppDeployKey,
  deleteAiAppTarget,
  deployAiApp,
  fetchAiAppDeployKeys,
  revokeAiAppDeployKey,
} from '@/services/ai-apps/ai-apps.service';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';

import { PublicEndpointsSection } from './PublicEndpointsSection';
import { DisclosureSection } from './SectionTitle';
import s from './DeploymentSettingsModal.module.scss';

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type Phase = 'form' | 'deploying' | 'done';

interface Props {
  app: AiApp;
  onClose: () => void;
  /**
   * Fires while a redeploy started from this modal is in flight, so a parent
   * page can suppress a competing "app is deploying" view for the duration —
   * mirrors AppSecretsPanel's prop of the same name/purpose.
   */
  onDeployingChange?: (deploying: boolean) => void;
}

/**
 * Deployment settings from the list card: update/replace secrets and
 * redeploy, plus the app's public endpoints (saved on their own, no redeploy). Secrets are write-only — a stored value can never be read back,
 * so a provided var shows as masked "Stored" until the creator chooses to
 * Replace it, and leaving it stored means "keep the stored value". Apps with
 * no secrets can still redeploy (plain restart of the stored bundle).
 *
 * Env var NAMES are snapshotted at mount: the post-deploy poll updates the
 * live record, and rows must not remount/lock mid-keystroke under the user.
 * Only `status` is read live, to drive the deploying → done/failed phases.
 */
export function DeploymentSettingsModal({ app, onClose, onDeployingChange }: Props) {
  const analytics = useAiAppsAnalytics();
  const queryClient = useQueryClient();

  const [environment, setEnvironment] = useState<AiAppTargetEnvironment>('prod');
  const [requiredEnvVars, setRequiredEnvVars] = useState(() => aiAppTarget(app, 'prod').requiredEnvVars);
  const [provided, setProvided] = useState(() => new Set(aiAppTarget(app, 'prod').providedEnvVars));
  const [keys, setKeys] = useState<AiAppDeployKeySummary[]>([]);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [revokeKeyUid, setRevokeKeyUid] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [confirmTeardown, setConfirmTeardown] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});
  // Stored vars the creator has chosen to replace (revealing an empty input).
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set once the live record is seen DEPLOYING after our POST — guards the
  // done-transition against a stale READY still sitting in the cache.
  const [deployObserved, setDeployObserved] = useState(false);

  // Live record: fresh canManage/status, and the 5s poll while DEPLOYING.
  const { app: liveApp } = useAiApp(app.uid);
  const source = liveApp ?? app;
  const target = aiAppTarget(source, environment);
  const liveStatus = target.status;
  const liveNotes = target.failureReason ?? null;
  const canManage = liveApp?.canManage ?? app.canManage ?? false;
  const hasBuild = target.hasBuild;

  const isDraft = target.status === 'DRAFT' || target.status === 'IN_DEVELOPMENT';
  const hasSecrets = requiredEnvVars.length > 0;
  // A draft has never been deployed, so the action is a first "Deploy" — only an
  // already-live app "Redeploys". Snapshotting `app.status` at open keeps the
  // verb stable through the post-deploy poll that flips the live record.
  const deployVerb = isDraft ? 'Deploy' : 'Redeploy';
  const deployingVerb = isDraft ? 'Deploying' : 'Redeploying';
  // A deploy already running that this modal didn't start (e.g. agent-triggered).
  const externalDeployInFlight = phase === 'form' && liveStatus === 'DEPLOYING';

  useEffect(() => {
    let cancelled = false;
    fetchAiAppDeployKeys(app.uid).then((rows) => {
      if (!cancelled) setKeys(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [app.uid]);

  const selectEnvironment = (next: AiAppTargetEnvironment) => {
    const nextTarget = aiAppTarget(liveApp ?? app, next);
    setEnvironment(next);
    setRequiredEnvVars(nextTarget.requiredEnvVars);
    setProvided(new Set(nextTarget.providedEnvVars));
    setValues({});
    setReplacing({});
    setPhase('form');
    setError(null);
    setBuildError(null);
    setKeysError(null);
    setConfirmTeardown(false);
    setCreatedToken(null);
    setRevokeKeyUid(null);
  };

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

  // Include `isSubmitting`, not just `phase` — the redeploy request is fired
  // synchronously on click (see handleRedeploy), well before `phase` itself
  // flips to 'deploying' once the response resolves. A parent relying only on
  // the `phase` transition would have a window where the backend has already
  // moved the app to DEPLOYING but this callback hasn't fired yet, letting an
  // independent poller elsewhere race ahead of it.
  useEffect(() => {
    onDeployingChange?.(isSubmitting || phase === 'deploying');
  }, [isSubmitting, phase, onDeployingChange]);

  // Unconditional unmount reset: if this modal is dismissed mid-'deploying'
  // (its own header close button isn't guarded against that, unlike
  // AppSecretsPanel's closeSecrets), the effect above never gets a chance to
  // fire `false` again — without this, a parent's "is a redeploy in flight"
  // flag would be stranded `true` for the rest of the page's session.
  useEffect(() => () => onDeployingChange?.(false), [onDeployingChange]);

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

    const result = await deployAiApp(app.uid, secrets, environment);

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
    // Logs are dropped (not just invalidated) so a reopened logs modal shows a
    // loader for this deploy, never the previous deploy's lines under the new
    // status chip. (Agent-triggered redeploys skip this path — the logs hook's
    // staleTime: 0 refetch-on-open is the safety net there.)
    queryClient.removeQueries({ queryKey: [AiAppsQueryKeys.AI_APP_LOGS, app.uid] });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, app.uid] }),
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
    ]);
    setIsSubmitting(false);
    const settled = result.app ? aiAppTarget(result.app, environment).status : null;
    setPhase(settled === 'DEPLOYING' ? 'deploying' : 'done');
  };

  const handleTeardown = async () => {
    if (!confirmTeardown) {
      setConfirmTeardown(true);
      return;
    }
    setIsSubmitting(true);
    setBuildError(null);
    const message = await deleteAiAppTarget(app.uid, environment);
    setIsSubmitting(false);
    if (message) {
      setBuildError(message);
      setConfirmTeardown(false);
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, app.uid] }),
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
    ]);
    onClose();
  };

  const handleCreateKey = async () => {
    setKeysError(null);
    const result = await createAiAppDeployKey(app.uid, environment);
    if ('error' in result) {
      setKeysError(result.error);
      return;
    }
    setCreatedToken(result.token);
    setKeys(await fetchAiAppDeployKeys(app.uid));
  };

  const handleRevokeKey = async () => {
    if (!revokeKeyUid || isRevoking) return;
    setIsRevoking(true);
    setKeysError(null);
    const keyUid = revokeKeyUid;
    const ok = await revokeAiAppDeployKey(app.uid, keyUid);
    setIsRevoking(false);
    setRevokeKeyUid(null);
    if (!ok) {
      setKeysError('Could not revoke that key.');
      return;
    }
    setKeys((current) => current.filter((key) => key.uid !== keyUid));
  };

  const envKeys = keys.filter((key) => key.environment === environment);

  return (
    <>
    <Modal
      isOpen
      onClose={onClose}
      className={s.modal}
      closeOnBackdropClick={false}
      closeOnEscape={!createdToken && !revokeKeyUid}
    >
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
              <div className={s.envSwitch} role="tablist" aria-label="Deployment environment">
                {(['prod', 'preview'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={environment === value}
                    className={environment === value ? s.envSwitchOn : s.envSwitchOff}
                    onClick={() => selectEnvironment(value)}
                    disabled={isSubmitting}
                  >
                    {value === 'prod' ? 'Production' : 'Preview'}
                  </button>
                ))}
              </div>
              <DisclosureSection icon="build" title="Build">
                <p className={s.intro}>The last bundle deployed to this environment.</p>
                {target.lastDeployedAt ? (
                  <p className={s.intro}>
                    {aiAppStatusLabel(target.status)}
                    {` · Last deployed ${formatWhen(target.lastDeployedAt)}`}
                    {target.agentClient ? ` · ${target.agentClient}` : ''}
                    {target.kitVersion ? ` · kit ${target.kitVersion}` : ''}
                  </p>
                ) : (
                  <p className={s.statusNote}>{aiAppStatusLabel(target.status)} · No successful deploy yet</p>
                )}
                {!hasBuild && (
                  <p className={s.statusNote}>
                    No build yet. Ask your AI agent to deploy here before you can deploy from LabOS.
                  </p>
                )}
                {externalDeployInFlight && <p className={s.statusNote}>A deploy is already in progress.</p>}
                {canManage && (target.url || target.lastDeployedAt) && (
                  <button type="button" className={s.linkBtn} onClick={handleTeardown} disabled={isSubmitting}>
                    {confirmTeardown ? 'Confirm tear down' : 'Tear down'}
                  </button>
                )}
                {buildError && <p className={s.error}>{buildError}</p>}
              </DisclosureSection>

              <DisclosureSection icon="secrets" title="App secrets">
                <p className={s.intro}>
                  {hasSecrets
                    ? 'Values the app reads at runtime. Stored ones stay until you replace them.'
                    : 'This environment has no secrets. Redeploy restarts it with the stored bundle.'}
                </p>
                {hasSecrets && (
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
                )}
                {error && <p className={s.error}>{error}</p>}
              </DisclosureSection>

              {canManage && (
                <DisclosureSection icon="keys" title="Deployment keys">
                  <p className={s.intro}>
                    Lets an agent or GitHub Actions deploy the app to this environment. The full key is shown once.
                  </p>
                  {envKeys.length > 0 && (
                    <ul className={s.keyList}>
                      {envKeys.map((key) => (
                        <li key={key.uid}>
                          <span className={s.keyMeta}>
                            <span className={s.keyPrefix}>{key.tokenPrefix}…</span>
                            <span className={s.keyTime}>Generated {formatWhen(key.createdAt)}</span>
                          </span>
                          <button type="button" className={s.dangerBtn} onClick={() => setRevokeKeyUid(key.uid)}>
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className={s.linkBtn} onClick={handleCreateKey} disabled={isSubmitting}>
                    Generate key
                  </button>
                  {keysError && <p className={s.error}>{keysError}</p>}
                </DisclosureSection>
              )}

              {canManage && (
                <PublicEndpointsSection
                  uid={app.uid}
                  lastDeployedAt={target.lastDeployedAt}
                  disabled={isSubmitting}
                  onRedeploy={handleRedeploy}
                  redeployDisabled={isSubmitting || externalDeployInFlight || !hasBuild}
                />
              )}
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
                disabled={isSubmitting || externalDeployInFlight || !hasBuild}
              >
                {isSubmitting ? `${deployingVerb}…` : deployVerb}
              </Button>
            </div>
          </>
        )}

        {phase === 'deploying' && (
          <div className={s.statusBody}>
            <Spinner />
            <p className={s.statusTitle}>
              {deployingVerb} {app.name}
            </p>
            <p className={s.statusText}>
              This usually takes a couple of minutes — you can close this and keep working.
            </p>
          </div>
        )}

        {phase === 'done' && (
          <>
            <div className={s.statusBody}>
              <SuccessCircleIcon width={44} height={44} className={s.successMark} aria-hidden />
              <p className={s.statusTitle}>{isDraft ? 'App deployed' : 'App redeployed'}</p>
              <p className={s.statusText}>
                {isDraft
                  ? 'Your app is live. Open it to take a look.'
                  : 'Your changes are live. Open the app to see the latest version.'}
              </p>
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

    <Modal
      isOpen={!!createdToken}
      onClose={() => setCreatedToken(null)}
      className={s.modal}
      overlayClassname={s.stackedOverlay}
    >
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Deployment key</h2>
          <button type="button" className={s.close} onClick={() => setCreatedToken(null)} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        <div className={s.keyRevealBody}>
          <p className={s.intro}>This key won&apos;t be shown again after you close this.</p>
          <p className={s.keyOnce}>{createdToken}</p>
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" size="s" onClick={() => setCreatedToken(null)}>
            Close
          </Button>
          <Button
            style="fill"
            variant="primary"
            size="s"
            onClick={() => {
              if (createdToken) navigator.clipboard?.writeText(createdToken);
            }}
          >
            Copy
          </Button>
        </div>
      </div>
    </Modal>

    <Modal
      isOpen={!!revokeKeyUid}
      onClose={() => {
        if (!isRevoking) setRevokeKeyUid(null);
      }}
      className={s.modal}
      overlayClassname={s.stackedOverlay}
      closeOnEscape={!isRevoking}
      closeOnBackdropClick={!isRevoking}
    >
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Revoke this key?</h2>
          <button
            type="button"
            className={s.close}
            onClick={() => setRevokeKeyUid(null)}
            aria-label="Close"
            disabled={isRevoking}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>
        <div className={s.keyRevealBody}>
          <p className={s.intro}>
            Anything still using it, including an agent or GitHub Actions, will no longer be able to deploy.
          </p>
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" size="s" onClick={() => setRevokeKeyUid(null)} disabled={isRevoking}>
            Cancel
          </Button>
          <Button style="fill" variant="error" size="s" onClick={handleRevokeKey} disabled={isRevoking}>
            {isRevoking ? 'Revoking…' : 'Revoke'}
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
