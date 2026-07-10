'use client';

import { useState } from 'react';
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
}

/**
 * Secret values form + Deploy button for the draft/secrets flow. Values are
 * write-only: stored ones can never be read back, so inputs for already-provided
 * vars start empty and blank means "keep the stored value".
 */
export function AppSecretsPanel(props: Props) {
  const { app, onDeployingChange } = props;

  const analytics = useAiAppsAnalytics();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDeploying = (deploying: boolean) => {
    setIsDeploying(deploying);
    onDeployingChange?.(deploying);
  };

  const provided = new Set(app.providedEnvVars);
  const isDraft = app.status === 'DRAFT';

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
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
    } else {
      analytics.onSecretsDeploySucceeded({ appUid: app.uid, isDraft });
      setValues({});
    }
    // Refresh in both outcomes — a failed deploy still changes the app status/notes.
    // Do it before clearing the deploying flag so the parent swaps back to the
    // iframe only once the refreshed record (fresh updatedAt) is in the cache.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APP_DETAIL, app.uid] }),
      queryClient.invalidateQueries({ queryKey: [AiAppsQueryKeys.AI_APPS_LIST] }),
    ]);
    setDeploying(false);
  };

  return (
    <div className={s.root}>
      <p className={s.intro}>
        {isDraft
          ? 'This app needs the following values before it can be deployed. They are stored securely on the sandbox and never shown again.'
          : 'Update one or more values and redeploy. Leave a field blank to keep its stored value.'}
      </p>

      <div className={s.fields}>
        {app.requiredEnvVars.map((name) => {
          const hasStoredValue = provided.has(name);
          return (
            <label key={name} className={s.field}>
              <span className={s.fieldName}>{name}</span>
              <input
                className={s.input}
                type="password"
                autoComplete="off"
                value={values[name] ?? ''}
                placeholder={hasStoredValue ? 'Value stored — leave blank to keep it' : 'Required'}
                onChange={(e) => onChange(name, e.target.value)}
                disabled={isDeploying}
              />
            </label>
          );
        })}
      </div>

      {error && <p className={s.error}>{error}</p>}

      <div className={s.actions}>
        <Button variant="primary" size="m" onClick={onDeploy} disabled={isDeploying}>
          {isDeploying ? 'Deploying…' : 'Deploy'}
        </Button>
        {isDeploying && <span className={s.deployNote}>The first deploy can take a couple of minutes.</span>}
      </div>
    </div>
  );
}
