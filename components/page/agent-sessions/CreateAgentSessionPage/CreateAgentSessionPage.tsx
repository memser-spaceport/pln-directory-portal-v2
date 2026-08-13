'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canAdminAgentSessions } from '@/services/rbac/utils/agentSessions/canAdminAgentSessions';
import { useAgentSessionRepositories } from '@/services/agent-sessions/hooks/useAgentSessionRepositories';
import { useCreateAgentSession } from '@/services/agent-sessions/hooks/useCreateAgentSession';
import s from '../shared/AgentSessions.module.scss';

export function CreateAgentSessionPage() {
  const router = useRouter();
  const { permsSet, isLoading: permsLoading } = usePermissions();
  const canAdmin = canAdminAgentSessions(permsSet);
  const { data: repositories, isLoading: reposLoading } = useAgentSessionRepositories();
  const createMutation = useCreateAgentSession();

  const enabledRepos = useMemo(() => (repositories ?? []).filter((repo) => repo.enabled), [repositories]);

  const [repository, setRepository] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [createFeatureEnvironment, setCreateFeatureEnvironment] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!permsLoading && !canAdmin) {
      router.replace('/pl-infra/agent-sessions');
    }
  }, [permsLoading, canAdmin, router]);

  useEffect(() => {
    if (!repository && enabledRepos.length > 0) {
      setRepository(enabledRepos[0].key);
      setBaseBranch(enabledRepos[0].defaultBranch);
    }
  }, [enabledRepos, repository]);

  const selectedRepo = enabledRepos.find((repo) => repo.key === repository);

  const handleRepositoryChange = (key: string) => {
    setRepository(key);
    const next = enabledRepos.find((repo) => repo.key === key);
    if (next) setBaseBranch(next.defaultBranch);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!repository || prompt.trim().length < 3) {
      setFormError('Repository and a prompt (at least 3 characters) are required.');
      return;
    }

    try {
      const session = await createMutation.mutateAsync({
        repository,
        baseBranch: baseBranch.trim() || undefined,
        prompt: prompt.trim(),
        createFeatureEnvironment,
      });
      router.push(`/pl-infra/agent-sessions/${session.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create session');
    }
  };

  if (permsLoading || !canAdmin) {
    return null;
  }

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/agent-sessions" className={s.backLink}>
          ← Back to sessions
        </Link>
        <div className={s.header}>
          <div className={s.titleBlock}>
            <h1 className={s.title}>New Agent Session</h1>
            <p className={s.description}>
              Submit a fix prompt for an allowed repository. The orchestrator will open a PR and optionally a feature
              environment.
            </p>
          </div>
        </div>

        <div className={s.panel}>
          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className={s.label} htmlFor="repository">
                Repository
              </label>
              <select
                id="repository"
                className={s.select}
                value={repository}
                disabled={reposLoading || enabledRepos.length === 0}
                onChange={(event) => handleRepositoryChange(event.target.value)}
              >
                {enabledRepos.map((repo) => (
                  <option key={repo.key} value={repo.key}>
                    {repo.displayName} ({repo.key})
                  </option>
                ))}
              </select>
              {selectedRepo ? <span className={s.muted}>Default branch: {selectedRepo.defaultBranch}</span> : null}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="baseBranch">
                Base branch (optional)
              </label>
              <input
                id="baseBranch"
                className={s.input}
                value={baseBranch}
                onChange={(event) => setBaseBranch(event.target.value)}
                placeholder="develop"
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="prompt">
                Prompt
              </label>
              <textarea
                id="prompt"
                className={s.textarea}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the change for the coding agent…"
                required
                minLength={3}
              />
            </div>

            <label className={s.checkboxRow}>
              <input
                type="checkbox"
                checked={createFeatureEnvironment}
                onChange={(event) => setCreateFeatureEnvironment(event.target.checked)}
              />
              Create feature environment after PR
            </label>

            {formError ? <p className={`${s.state} ${s.error}`}>{formError}</p> : null}

            <div className={s.actions}>
              <Link href="/pl-infra/agent-sessions" className={s.secondaryButton}>
                Cancel
              </Link>
              <button type="submit" className={s.primaryButton} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
