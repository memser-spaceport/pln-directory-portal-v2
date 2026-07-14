/**
 * In-memory draft of secret form values, keyed by app uid.
 *
 * Survives React remounts within the same tab (access-guard flicker, query
 * reloads) without writing secret values to sessionStorage/localStorage.
 * Cleared on successful deploy. Lost on a full page reload — expected.
 */
export type SecretsDraft = {
  values: Record<string, string>;
  editing: Record<string, boolean>;
};

const drafts = new Map<string, SecretsDraft>();

export function readSecretsDraft(appUid: string): SecretsDraft {
  return drafts.get(appUid) ?? { values: {}, editing: {} };
}

export function writeSecretsDraft(appUid: string, draft: SecretsDraft): void {
  const hasValues = Object.values(draft.values).some((value) => value.length > 0);
  const hasEditing = Object.values(draft.editing).some(Boolean);
  if (!hasValues && !hasEditing) {
    drafts.delete(appUid);
    return;
  }
  drafts.set(appUid, {
    values: { ...draft.values },
    editing: { ...draft.editing },
  });
}

export function clearSecretsDraft(appUid: string): void {
  drafts.delete(appUid);
}
