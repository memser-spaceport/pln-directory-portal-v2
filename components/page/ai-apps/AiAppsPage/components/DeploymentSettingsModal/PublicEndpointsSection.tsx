'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { useAiAppPublicPaths } from '@/services/ai-apps/hooks/useAiAppPublicPaths';
import { useSaveAiAppPublicPaths } from '@/services/ai-apps/hooks/useSaveAiAppPublicPaths';
import { AI_APPS_MAX_PUBLIC_PATHS, validatePublicPath } from '@/services/ai-apps/utils/validatePublicPath';

import s from './DeploymentSettingsModal.module.scss';

interface Props {
  uid: string;
  /** Null = never shipped: nothing is serving yet, so there is no old sidecar to warn about. */
  lastDeployedAt?: string | null;
  /** Disables editing while the modal's own deploy is in flight. */
  disabled?: boolean;
  /** Runs the modal's redeploy — used when the running sidecar predates public paths. */
  onRedeploy: () => void;
  redeployDisabled?: boolean;
}

type Row = { id: number; value: string };

let nextRowId = 0;
const toRows = (paths: string[]): Row[] => paths.map((value) => ({ id: nextRowId++, value }));

/**
 * Public endpoints: path patterns the deployed app serves to anyone, without
 * LabOS sign-in. Saved on its own (never redeploys) and applied by the auth
 * sidecar on the next request. The app itself must protect these paths, so
 * the warning is always shown.
 */
export function PublicEndpointsSection({ uid, lastDeployedAt, disabled, onRedeploy, redeployDisabled }: Props) {
  const { settings, error: loadError, isLoading } = useAiAppPublicPaths(uid);
  const { mutateAsync, isPending: isSaving } = useSaveAiAppPublicPaths(uid);

  // Seeded once from the first load; later refetches must not clobber edits.
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (settings && rows === null) {
    setRows(toRows(settings.publicPaths));
  }

  if (isLoading || (!settings && !loadError)) {
    return (
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Public endpoints</h3>
        <p className={s.intro}>Loading…</p>
      </section>
    );
  }

  if (!settings || rows === null) {
    return (
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Public endpoints</h3>
        <p className={s.error}>{loadError}</p>
      </section>
    );
  }

  const values = rows.map((row) => row.value.trim());
  const errors = values.map((value, index) => {
    const invalid = validatePublicPath(value);
    if (invalid) return invalid;
    return values.indexOf(value) !== index ? 'Already in the list' : null;
  });
  const tooMany = values.length > AI_APPS_MAX_PUBLIC_PATHS;
  const isValid = !tooMany && errors.every((error) => error === null);
  const isDirty =
    values.length !== settings.publicPaths.length ||
    values.some((value, index) => value !== settings.publicPaths[index]);
  const gateNotReady = !settings.publicPathsGateReady && !!lastDeployedAt;
  const locked = disabled || isSaving;

  const edit = (next: Row[]) => {
    setRows(next);
    setSaveError(null);
    setJustSaved(false);
  };

  const onChange = (id: number, value: string) => {
    edit(rows.map((row) => (row.id === id ? { ...row, value } : row)));
  };

  const handleSave = async () => {
    if (!isDirty || !isValid || locked) return;
    const result = await mutateAsync(values);
    if (result.error || !result.data) {
      setSaveError(result.error ?? 'Saving failed. Please try again.');
      return;
    }
    setRows(toRows(result.data.publicPaths));
    setJustSaved(true);
  };

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>Public endpoints</h3>
      <p className={s.intro}>
        Paths anyone can call without signing in to LabOS — for webhooks or a public API. Use <code>*</code> for
        “anything after”, e.g. <code>/api/*</code> (add <code>/api</code> separately if needed). Changes apply right
        away, no redeploy.
      </p>

      <div className={s.notice}>
        <p className={s.noticeTitle}>Your app must protect these paths</p>
        <p className={s.noticeText}>
          LabOS doesn’t check sign-in here, so anyone with the URL can call them. Verify webhook signatures, require an
          API key, and never expose member data or admin actions on a public path.
        </p>
      </div>

      {gateNotReady && (
        <div className={s.notice}>
          <p className={s.noticeText}>
            This app was deployed before public endpoints existed. They start working after one redeploy.
          </p>
          <div>
            <Button
              style="border"
              variant="neutral"
              size="s"
              onClick={onRedeploy}
              disabled={redeployDisabled || locked}
            >
              Redeploy now
            </Button>
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <ul className={s.pathList}>
          {rows.map((row, index) => (
            <li key={row.id} className={s.pathItem}>
              <div className={s.editRow}>
                <input
                  className={s.input}
                  value={row.value}
                  placeholder="/api/*"
                  aria-label="Public path pattern"
                  aria-invalid={!!errors[index]}
                  onChange={(e) => onChange(row.id, e.target.value)}
                  disabled={locked}
                />
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => edit(rows.filter((item) => item.id !== row.id))}
                  aria-label={`Remove ${row.value || 'path'}`}
                  disabled={locked}
                >
                  <CloseIcon width={16} height={16} />
                </button>
              </div>
              {errors[index] && <p className={s.error}>{errors[index]}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.statusText}>No public endpoints — every path requires LabOS sign-in.</p>
      )}

      {tooMany && <p className={s.error}>An app can have at most {AI_APPS_MAX_PUBLIC_PATHS} public paths.</p>}
      {saveError && <p className={s.error}>{saveError}</p>}

      <div className={s.sectionFooter}>
        <button
          type="button"
          className={s.linkBtn}
          onClick={() => edit([...rows, ...toRows([''])])}
          disabled={locked || rows.length >= AI_APPS_MAX_PUBLIC_PATHS}
        >
          + Add path
        </button>
        <div className={s.sectionActions}>
          {justSaved && !isDirty && <span className={s.savedText}>Saved</span>}
          <Button
            style="fill"
            variant="primary"
            size="s"
            onClick={handleSave}
            disabled={!isDirty || !isValid || locked}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  );
}
