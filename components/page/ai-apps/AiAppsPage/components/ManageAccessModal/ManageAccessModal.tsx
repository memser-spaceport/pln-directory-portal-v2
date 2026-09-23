'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { AiApp, AiAppAccessMode, AiAppAccessCandidate } from '@/services/ai-apps/ai-apps.service';
import { useAiAppAccess } from '@/services/ai-apps/hooks/useAiAppAccess';
import { useSaveAiAppAccess } from '@/services/ai-apps/hooks/useSaveAiAppAccess';

import { AiAppMemberSearch } from './components/AiAppMemberSearch';
import { GlobeIcon, LockIcon } from './icons';

import s from './ManageAccessModal.module.scss';

type Person = { uid: string; name: string; image: string | null };

interface Props {
  app: AiApp;
  onClose: () => void;
  /**
   * Opens Deployment settings to redeploy. Offered after saving Private on an
   * app whose running sidecar predates per-app access (its direct link stays
   * open to PL Infra members until the next deploy).
   */
  onRedeploy?: () => void;
}

const MODE_OPTIONS: Array<{ value: AiAppAccessMode; title: string; description: string; icon: ReactNode }> = [
  {
    value: 'PRIVATE',
    title: 'Private',
    description: 'Only you and the people you add can find and open this app.',
    icon: <LockIcon />,
  },
  {
    value: 'OPEN',
    title: 'All PL Infra members',
    description: 'Anyone with AI Apps access can find and open it.',
    icon: <GlobeIcon />,
  },
];

function sameMembers(a: Person[], b: Person[]): boolean {
  if (a.length !== b.length) return false;
  const uids = new Set(a.map((member) => member.uid));
  return b.every((member) => uids.has(member.uid));
}

/**
 * Who can find and open an app: Private (owner + a whitelist of members) or
 * all PL Infra members. Edits stay local until Save, which replaces the mode
 * and the whole list in one request. The list is kept while the app is open,
 * so switching back to Private restores it.
 */
export function ManageAccessModal({ app, onClose, onRedeploy }: Props) {
  const { settings, error: loadError, isLoading } = useAiAppAccess(app.uid);
  const saveAccess = useSaveAiAppAccess(app.uid);

  const [mode, setMode] = useState<AiAppAccessMode | null>(null);
  const [members, setMembers] = useState<Person[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  // After a Private save on an app still running a pre-access sidecar.
  const [needsRedeploy, setNeedsRedeploy] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Seed the form once, from the first fresh load (adjusting state during
  // render, so the form never paints empty first).
  if (settings && mode === null) {
    setMode(settings.access);
    setMembers(settings.members.map(({ uid, name, image }) => ({ uid, name, image })));
  }

  const isSaving = saveAccess.isPending;
  const isDirty = useMemo(() => {
    if (!settings || mode === null) return false;
    return mode !== settings.access || !sameMembers(members, settings.members);
  }, [settings, mode, members]);

  // Only a shipped app has a running sidecar; a never-deployed app's first
  // deploy already ships the per-app one.
  const gateNotReady = !!settings && !settings.directLinkGateReady && !!app.lastDeployedAt;

  const addMember = (candidate: AiAppAccessCandidate) => {
    setMembers((current) =>
      current.some((member) => member.uid === candidate.uid)
        ? current
        : [...current, { uid: candidate.uid, name: candidate.name, image: candidate.image }],
    );
  };

  const removeMember = (uid: string) => {
    setMembers((current) => current.filter((member) => member.uid !== uid));
  };

  const handleSave = async () => {
    if (!mode) return;
    setSaveError(null);
    const result = await saveAccess.mutateAsync({ access: mode, memberUids: members.map((member) => member.uid) });
    if (result.error || !result.data) {
      setSaveError(result.error ?? 'Saving failed. Please try again.');
      return;
    }
    if (result.data.access === 'PRIVATE' && gateNotReady && onRedeploy) {
      setNeedsRedeploy(true);
      return;
    }
    onClose();
  };

  const renderBody = () => {
    if (isLoading || (settings && mode === null)) {
      return <p className={s.state}>Loading…</p>;
    }
    if (loadError || !settings || !mode) {
      return <p className={s.errorText}>{loadError ?? 'Could not load who has access. Please try again.'}</p>;
    }

    if (needsRedeploy) {
      return (
        <div className={s.notice} role="status">
          <p className={s.noticeTitle}>Saved. One more step to lock the direct link</p>
          <p className={s.noticeText}>
            {app.name} is now hidden from members you haven&apos;t added. It was deployed before private access existed,
            so its direct link stays open to PL Infra members until you redeploy it.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={s.options} role="radiogroup" aria-label="Who can access this app">
          {MODE_OPTIONS.map((option) => (
            <label key={option.value} className={clsx(s.option, { [s.optionSelected]: mode === option.value })}>
              <input
                type="radio"
                name="ai-app-access"
                className={s.radio}
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
                disabled={isSaving}
              />
              <span className={s.optionIcon}>{option.icon}</span>
              <span className={s.optionText}>
                <span className={s.optionTitle}>{option.title}</span>
                <span className={s.optionDescription}>{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        {mode === 'PRIVATE' ? (
          <div className={s.field}>
            <span className={s.label}>People with access</span>
            <AiAppMemberSearch
              appUid={app.uid}
              addedUids={members.map((member) => member.uid)}
              onAdd={addMember}
              disabled={isSaving}
              onDropdownChange={setIsSearchOpen}
            />
            <ul className={s.people}>
              <li className={s.person}>
                <img
                  className={s.avatar}
                  src={app.member.image || getDefaultAvatar(app.member.name)}
                  alt=""
                  width={32}
                  height={32}
                />
                <span className={s.personName}>{app.member.name}</span>
                <span className={s.ownerTag}>Owner</span>
              </li>
              {members.map((member) => (
                <li key={member.uid} className={s.person}>
                  <img
                    className={s.avatar}
                    src={member.image || getDefaultAvatar(member.name)}
                    alt=""
                    width={32}
                    height={32}
                  />
                  <span className={s.personName}>{member.name}</span>
                  <button
                    type="button"
                    className={s.removeBtn}
                    onClick={() => removeMember(member.uid)}
                    disabled={isSaving}
                    aria-label={`Remove ${member.name}`}
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
            {members.length === 0 && <p className={s.helpText}>Only you can see this app. Add people to share it.</p>}
            {gateNotReady && (
              <div className={s.notice}>
                <p className={s.noticeText}>
                  This app was deployed before private access existed. LabOS hides it right away, but its direct link
                  stays open to PL Infra members until you redeploy.
                </p>
              </div>
            )}
          </div>
        ) : (
          members.length > 0 && (
            <p className={s.helpText}>
              Your list of {members.length} {members.length === 1 ? 'person' : 'people'} is kept if you switch back to
              Private.
            </p>
          )
        )}

        {saveError && <p className={s.errorText}>{saveError}</p>}
      </>
    );
  };

  return (
    <Modal isOpen onClose={onClose} className={s.modal} closeOnBackdropClick={false} closeOnEscape={!isSearchOpen}>
      <div className={s.content}>
        <div className={s.header}>
          <h2 className={s.title}>Manage access</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>{renderBody()}</div>

        <div className={s.footer}>
          {needsRedeploy ? (
            <>
              <Button style="border" variant="neutral" size="s" onClick={onClose}>
                Later
              </Button>
              <Button style="fill" variant="primary" size="s" onClick={onRedeploy}>
                Redeploy now
              </Button>
            </>
          ) : (
            <>
              <Button style="border" variant="neutral" size="s" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button style="fill" variant="primary" size="s" onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
