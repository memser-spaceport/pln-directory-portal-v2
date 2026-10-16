'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { toast } from '@/components/core/ToastContainer';
import { CloseIcon } from '@/components/icons';
import { AiApp } from '@/services/ai-apps/ai-apps.service';
import { useAiAppLinearTarget } from '@/services/ai-apps/hooks/useAiAppLinearTarget';
import { useAiAppLinearTeams } from '@/services/ai-apps/hooks/useAiAppLinearTeams';
import { useSaveAiAppLinearTarget } from '@/services/ai-apps/hooks/useSaveAiAppLinearTarget';

import s from './LinearTargetModal.module.scss';

interface Props {
  app: AiApp;
  onClose: () => void;
}

/**
 * Where the app's private feedback goes in Linear: one of the caller's private
 * teams, plus an optional project. Edits stay local until Save; "Stop sending"
 * clears the target. Only new private feedback is sent from then on.
 */
export function LinearTargetModal({ app, onClose }: Props) {
  const { target, error: targetError, unavailable, isLoading: targetLoading } = useAiAppLinearTarget(app.uid);
  const { teams, error: teamsError, isLoading: teamsLoading } = useAiAppLinearTeams({ enabled: !unavailable });
  const save = useSaveAiAppLinearTarget(app.uid);

  /* The user's edits; null = untouched, so the saved target shows through once it loads. */
  const [editedTeamId, setEditedTeamId] = useState<string | null>(null);
  const [editedProjectId, setEditedProjectId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const savedTeamId = target?.teamId ?? '';
  const savedProjectId = target?.projectId ?? '';
  const teamId = editedTeamId ?? savedTeamId;
  const projectId = editedProjectId ?? (editedTeamId === null ? savedProjectId : '');

  const team = useMemo(() => teams?.find((option) => option.id === teamId) ?? null, [teams, teamId]);
  /* A target set by someone else (an admin) can be a team the caller isn't in: keep it selectable. */
  const savedTeamMissing = !!target?.teamId && !!teams && !teams.some((option) => option.id === target.teamId);
  const isSaving = save.isPending;
  const isDirty = !!target && (teamId !== savedTeamId || projectId !== savedProjectId);

  const submit = async (input: { teamId: string | null; projectId?: string | null }, success: string) => {
    setSaveError(null);
    const result = await save.mutateAsync(input);
    if (result.error || !result.data) {
      setSaveError(result.error ?? 'Saving failed. Please try again.');
      return;
    }
    toast.success(success);
    onClose();
  };

  const handleSave = () => {
    if (!teamId) return;
    const label = team ? team.key : 'the selected team';
    void submit({ teamId, projectId: projectId || null }, `New feedback on ${app.name} will go to ${label} in Linear`);
  };

  const handleStop = () => {
    void submit({ teamId: null }, `Feedback on ${app.name} is no longer sent to Linear`);
  };

  const renderBody = () => {
    if (unavailable) {
      return <p className={s.state}>Linear isn&apos;t set up for this environment.</p>;
    }
    if (targetLoading || teamsLoading) {
      return <p className={s.state}>Loading…</p>;
    }
    if (targetError || teamsError || !target || !teams) {
      return <p className={s.errorText}>{targetError ?? teamsError ?? 'Could not load your Linear teams.'}</p>;
    }
    return (
      <>
        <ul className={s.rules}>
          <li>Only private Linear teams you belong to are listed.</li>
          <li>Only new private feedback is sent: not comments, and not feedback left before you save.</li>
          <li>Reporters are named and linked to their LabOS profile. Their emails are never shared.</li>
        </ul>

        {teams.length === 0 && !savedTeamMissing ? (
          <p className={s.notice}>
            You aren&apos;t in any private Linear team the LabOS app can reach. Ask a Linear admin to give the LabOS app
            access to your team.
          </p>
        ) : (
          <>
            <label className={s.field}>
              <span className={s.label}>Linear team</span>
              <select
                className={s.select}
                value={teamId}
                onChange={(event) => {
                  setEditedTeamId(event.target.value);
                  setEditedProjectId('');
                }}
                disabled={isSaving}
              >
                <option value="">Choose a team</option>
                {savedTeamMissing && <option value={target.teamId ?? ''}>Current team (not one of yours)</option>}
                {teams.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.key} · {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={s.field}>
              <span className={s.label}>Project (optional)</span>
              <select
                className={s.select}
                value={projectId}
                onChange={(event) => setEditedProjectId(event.target.value)}
                disabled={isSaving || !team || team.projects.length === 0}
              >
                <option value="">No project</option>
                {(team?.projects ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {saveError && <p className={s.errorText}>{saveError}</p>}
      </>
    );
  };

  const canStop = !!target?.teamId && !unavailable;

  return (
    <Modal isOpen onClose={onClose} className={s.modal} closeOnBackdropClick={false}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Send feedback to Linear</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>{renderBody()}</div>

        <div className={s.footer}>
          {canStop && (
            <Button
              className={s.stop}
              style="border"
              variant="neutral"
              size="s"
              onClick={handleStop}
              disabled={isSaving}
            >
              Stop sending
            </Button>
          )}
          <Button style="border" variant="neutral" size="s" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            style="fill"
            variant="primary"
            size="s"
            onClick={handleSave}
            disabled={unavailable || !teamId || !isDirty || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
