'use client';

// Copy-and-simplify of components/page/ai-apps/AiAppDetailPage/components/
// AppSecretsPanel (which is react-query bound) with the proposed stored-value
// treatment: a stored key renders as a locked masked row with an Edit action,
// and the primary button reads Re-deploy instead of Deploy.

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button/Button';

import panel from '@/components/page/ai-apps/AiAppDetailPage/components/AppSecretsPanel/AppSecretsPanel.module.scss';
import s from './AiAppsSecrets.module.scss';

import type { MockSecretsApp } from './mocks';

interface Props {
  app: MockSecretsApp;
  /** Fires when the fake deploy round trip finishes, with the vars that were filled in. */
  onDeployed: (filledVars: string[]) => void;
}

export function AppSecretsPanelMock(props: Props) {
  const { app, onDeployed } = props;

  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deployTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(deployTimer.current), []);

  const provided = new Set(app.providedEnvVars);
  const hasStored = app.providedEnvVars.length > 0;
  const isDraft = app.status === 'DRAFT';

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (name: string) => {
    setEditing((prev) => ({ ...prev, [name]: true }));
  };

  const cancelEdit = (name: string) => {
    setEditing((prev) => ({ ...prev, [name]: false }));
    setValues((prev) => ({ ...prev, [name]: '' }));
  };

  const onDeploy = () => {
    const filled = Object.entries(values)
      .filter(([, value]) => value.trim())
      .map(([name]) => name);

    const missing = app.requiredEnvVars.filter((name) => !provided.has(name) && !values[name]?.trim());
    if (missing.length) {
      setError(`Enter a value for: ${missing.join(', ')}`);
      return;
    }

    setError(null);
    setIsDeploying(true);
    // Fake the deploy round trip; production awaits deployAiApp + cache refresh.
    deployTimer.current = setTimeout(() => {
      setValues({});
      setEditing({});
      setIsDeploying(false);
      onDeployed(filled);
    }, 1800);
  };

  return (
    <div className={panel.root}>
      <p className={panel.intro}>
        {isDraft
          ? 'This app needs the following values before it can be deployed. They are stored securely on the sandbox and never shown again.'
          : 'Update one or more values and re-deploy. Stored values are kept unless you edit them.'}
      </p>

      <div className={panel.fields}>
        {app.requiredEnvVars.map((name) => {
          const stored = provided.has(name);
          const isEditing = !!editing[name];

          return (
            <div key={name} className={panel.field}>
              <span className={s.fieldLabelRow}>
                <span className={panel.fieldName}>{name}</span>
                {stored && isEditing && (
                  <button type="button" className={s.inlineLink} onClick={() => cancelEdit(name)} disabled={isDeploying}>
                    Cancel — keep stored value
                  </button>
                )}
              </span>

              {stored && !isEditing ? (
                <div className={clsx(panel.input, s.lockedInput)}>
                  <span className={s.maskedValue} aria-hidden>
                    ••••••••••••••••
                  </span>
                  <button type="button" className={s.inlineLink} onClick={() => startEdit(name)} disabled={isDeploying}>
                    Edit
                  </button>
                </div>
              ) : (
                <input
                  className={panel.input}
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

      {error && <p className={panel.error}>{error}</p>}

      <div className={panel.actions}>
        <Button variant="primary" size="m" onClick={onDeploy} disabled={isDeploying}>
          {isDeploying ? (hasStored ? 'Re-deploying…' : 'Deploying…') : hasStored ? 'Re-deploy' : 'Deploy'}
        </Button>
        {isDeploying && (
          <span className={panel.deployNote}>
            {hasStored ? 'Restarting the app with the updated values.' : 'The first deploy can take a couple of minutes.'}
          </span>
        )}
      </div>
    </div>
  );
}
