'use client';

import { useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CloseIcon, ErrorCircle, SuccessCircleIcon } from '@/components/icons';

import type { AiAppWithDoc } from './mocks';

import s from './DeploymentSettingsModal.module.scss';

/** How long the mock redeploy shows its loader before reporting an outcome. */
const REDEPLOY_MS = 2600;

type Phase = 'form' | 'deploying' | 'done' | 'failed';

interface Props {
  isOpen: boolean;
  app: AiAppWithDoc;
  onClose: () => void;
  /**
   * Fires when the redeploy is confirmed. Receives the app with any
   * newly-provided secrets folded into `providedEnvVars`, so the parent can
   * persist them. Progress and outcome are shown inside this modal — the app
   * page stays untouched.
   */
  onRedeploy: (app: AiAppWithDoc) => void;
  /** Opens the deployment logs, scoped to the stream that holds the failure. */
  onViewLogs: () => void;
}

/**
 * Prototype-only mirror of production's AppSecretsPanel: env-var fields plus a
 * Redeploy action. No network — the real panel calls `deployAiApp`; here the
 * deploy is faked in-modal. Secrets are write-only: a stored value can never be
 * read back, so a provided var shows as masked "stored" until the creator
 * chooses to Replace it, and blank means "keep the stored value".
 */
export function DeploymentSettingsModal({ isOpen, app, onClose, onRedeploy, onViewLogs }: Props) {
  const provided = new Set(app.providedEnvVars);
  const requiredEnvVars = app.requiredEnvVars ?? [];
  const hasSecrets = requiredEnvVars.length > 0;

  const [values, setValues] = useState<Record<string, string>>({});
  // Stored vars the creator has chosen to replace (revealing an empty input).
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

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

  const handleRedeploy = () => {
    const willProvide = new Set(provided);
    for (const [name, value] of Object.entries(values)) {
      if (value.trim()) willProvide.add(name);
    }

    const missing = requiredEnvVars.filter((name) => !willProvide.has(name));
    if (missing.length) {
      setError(`Enter a value for: ${missing.join(', ')}`);
      return;
    }

    onRedeploy({ ...app, providedEnvVars: Array.from(willProvide) });
    setPhase('deploying');
    // An app that is already failing fails again — updating a secret doesn't fix
    // an OOM kill or a type error. Redeploying without changing the underlying
    // cause reproducing the same failure is the honest outcome.
    timer.current = setTimeout(() => setPhase(app.status === 'ERROR' ? 'failed' : 'done'), REDEPLOY_MS);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={s.modal}>
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
                              <button type="button" className={s.linkBtn} onClick={() => startReplace(name)}>
                                Replace
                              </button>
                            </div>
                          ) : (
                            <div className={s.editRow}>
                              <input
                                className={s.input}
                                type="password"
                                autoComplete="off"
                                value={values[name] ?? ''}
                                placeholder={isStored ? 'Enter a new value' : 'Enter a value'}
                                onChange={(e) => onChange(name, e.target.value)}
                              />
                              {isStored && (
                                <button type="button" className={s.linkBtn} onClick={() => cancelReplace(name)}>
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

              {error && <p className={s.error}>{error}</p>}
            </div>

            <div className={s.footer}>
              <Button style="border" variant="neutral" size="s" onClick={onClose}>
                Cancel
              </Button>
              <Button style="fill" variant="primary" size="s" onClick={handleRedeploy}>
                Redeploy
              </Button>
            </div>
          </>
        )}

        {phase === 'deploying' && (
          <div className={s.statusBody}>
            <Spinner />
            <p className={s.statusTitle}>Redeploying {app.name}</p>
            <p className={s.statusText}>This usually takes a couple of minutes — you can close this and keep working.</p>
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

        {phase === 'failed' && (
          <>
            <div className={s.statusBody}>
              <ErrorCircle width={44} height={44} className={s.failMark} aria-hidden />
              <p className={s.statusTitle}>Redeploy failed</p>
              {/* Name the cause here rather than sending them to the logs to
                  find it — the logs are for the detail, not the headline. */}
              <p className={s.statusText}>{app.deployment?.failureReason ?? 'The deploy did not complete.'}</p>
              {app.deployment?.failureStream === 'runtime' && (
                <p className={s.statusHint}>Your previous version is still running and serving traffic.</p>
              )}
            </div>
            <div className={s.footer}>
              <button type="button" className={s.logsLink} onClick={onViewLogs}>
                See logs
              </button>
              <Button style="border" variant="neutral" size="s" onClick={() => setPhase('form')}>
                Back
              </Button>
              <Button style="fill" variant="primary" size="s" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
