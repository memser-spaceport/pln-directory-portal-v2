'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { Button } from '@/components/common/Button/Button';
import { AiApp, deployAiApp } from '@/services/ai-apps/ai-apps.service';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';

import s from './AppSecretsPanel.module.scss';

interface Props {
  app: AiApp;
  /** Fires while a deploy is in flight, so the parent can hide the stale iframe. */
  onDeployingChange?: (deploying: boolean) => void;
  /** Fires once a deploy succeeds and the refreshed app record is in the cache. */
  onDeploySucceeded?: () => void;
}

/**
 * Secret values form + Deploy button for the draft/secrets flow. Values are
 * write-only: stored ones can never be read back, so a var that's already
 * provided renders as a locked, masked row until the user explicitly clicks
 * Edit; leaving it locked (or cancelling out of an edit) means "keep the
 * stored value".
 */
export function AppSecretsPanel(props: Props) {
  const { app, onDeployingChange, onDeploySucceeded } = props;

  const analytics = useAiAppsAnalytics();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set by cancelEdit, consumed by the Edit button's ref callback once the
  // locked row remounts — moves focus back there instead of losing it to <body>.
  const pendingFocusName = useRef<string | null>(null);

  const setDeploying = (deploying: boolean) => {
    setIsDeploying(deploying);
    onDeployingChange?.(deploying);
  };

  const provided = new Set(app.providedEnvVars);
  const isDraft = app.status === 'DRAFT';
  // No env vars to collect — the panel is a plain retry of the stored bundle
  // (shown after a failed/stuck deploy of a non-secrets app).
  const isRetry = app.requiredEnvVars.length === 0;

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (name: string) => {
    setEditing((prev) => ({ ...prev, [name]: true }));
  };

  const cancelEdit = (name: string) => {
    setEditing((prev) => ({ ...prev, [name]: false }));
    setValues((prev) => ({ ...prev, [name]: '' }));
    pendingFocusName.current = name;
  };

  const onDeploy = async () => {
    const secrets: Record<string, string> = {};
    for (const [name, value] of Object.entries(values)) {
      if (value.trim()) {
        secrets[name] = value.trim();
      }
    }

    const missing = app.requiredEnvVars.filter((name) => !provided.has(name) && !secrets[name]);
    if (missing.length) {
      setError(`Enter a value for: ${missing.join(', ')}`);
      return;
    }

    const willProvide = new Set(provided);
    for (const [name, value] of Object.entries(secrets)) {
      if (value.trim()) willProvide.add(name);
    }
    const varsProvidedCount = app.requiredEnvVars.filter((name) => willProvide.has(name)).length;

    setError(null);
    setDeploying(true);
    analytics.onSecretsDeployClicked({
      appUid: app.uid,
      isDraft,
      varsRequiredCount: app.requiredEnvVars.length,
      varsProvidedCount,
    });
    const result = await deployAiApp(app.uid, secrets);

    if (result.error) {
      setError(result.error);
      // Keep `values` and `editing` as-is on failure — an unlocked field stays
      // unlocked with its typed value intact so the user can retry without
      // re-typing or losing their place.
    } else {
      analytics.onSecretsDeploySucceeded({ appUid: app.uid, isDraft });
      setValues({});
      setEditing({});
    }
    // Refresh in both outcomes — a failed deploy still changes the app status/notes.
    // Do it before clearing the deploying flag so the parent swaps back to the
    // iframe only once the refreshed record (fresh updatedAt) is in the cache.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, app.uid] }),
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
    ]);
    setDeploying(false);
    // Fire after the flag clears and the cache is fresh, so if the parent uses
    // this to decide whether to reveal the running app again, it reads the
    // app's post-deploy status rather than a stale pre-deploy snapshot.
    if (!result.error) {
      onDeploySucceeded?.();
    }
  };

  return (
    <div className={s.root}>
      <p className={s.intro}>
        {isRetry
          ? 'Retry deploying the stored app bundle to the sandbox. If the sandbox runner had an outage, retrying once it recovers usually fixes it — but if the app itself fails to build, ask your AI agent to fix it and deploy again.'
          : isDraft
            ? 'This app needs the following values before it can be deployed. They are stored securely on the sandbox and never shown again.'
            : 'Update one or more values and re-deploy. Stored values are kept unless you edit them.'}
      </p>

      {!isRetry && (
        <div className={s.fields}>
          {app.requiredEnvVars.map((name) => {
            const stored = provided.has(name);
            const isEditing = !!editing[name];
            const inputId = `secret-${name}`;

            return (
              <div key={name} className={s.field}>
                <span className={s.fieldLabelRow}>
                  <label htmlFor={inputId} className={s.fieldName}>
                    {name}
                  </label>
                  {stored && isEditing && (
                    <button
                      type="button"
                      className={s.inlineLink}
                      onClick={() => cancelEdit(name)}
                      disabled={isDeploying}
                    >
                      Cancel — keep stored value
                    </button>
                  )}
                </span>

                {stored && !isEditing ? (
                  <div className={`${s.input} ${s.lockedInput}`}>
                    <span className={s.maskedValue} aria-hidden>
                      ••••••••••••••••
                    </span>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el && pendingFocusName.current === name) {
                          el.focus();
                          pendingFocusName.current = null;
                        }
                      }}
                      className={s.inlineLink}
                      onClick={() => startEdit(name)}
                      disabled={isDeploying}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <input
                    id={inputId}
                    className={s.input}
                    type="password"
                    autoComplete="off"
                    autoFocus={isEditing}
                    value={values[name] ?? ''}
                    placeholder={stored ? 'Enter new value' : 'Required'}
                    onChange={(e) => onChange(name, e.target.value)}
                    disabled={isDeploying}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className={s.error}>{error}</p>}

      <div className={s.actions}>
        <Button variant="primary" size="m" onClick={onDeploy} disabled={isDeploying}>
          {isDeploying
            ? isRetry
              ? 'Retrying…'
              : isDraft
                ? 'Deploying…'
                : 'Re-deploying…'
            : isRetry
              ? 'Retry deploy'
              : isDraft
                ? 'Deploy'
                : 'Re-deploy'}
        </Button>
        {isDeploying && (
          <span className={s.deployNote}>
            {isRetry
              ? 'Redeploying the stored bundle — this can take a couple of minutes.'
              : isDraft
                ? 'The first deploy can take a couple of minutes.'
                : 'Restarting the app with the updated values.'}
          </span>
        )}
      </div>
    </div>
  );
}
