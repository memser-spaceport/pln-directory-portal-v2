'use client';

import type { KeyboardEvent } from 'react';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { Button } from '@/components/common/Button';
import { CommentIcon, DocumentIcon, EyeIcon } from '@/components/icons';
// Production's activity-metric item — 12px tertiary icon + value + label with a
// self-hiding "·" between. It already exists because notification cards show
// views / likes / comments this way; a card meta row is the same job.
import { DetailsItem } from '@/components/core/UpdatesPanel/NotificationItem/components/NotificationFooter/components/DetailsItem';
import nf from '@/components/core/UpdatesPanel/NotificationItem/components/NotificationFooter/NotificationFooter.module.scss';

import { formatCount, formatMinutesAgo, type AiAppWithDoc } from './mocks';
import { AppActionsMenu } from './AppActionsMenu';

import s from './AiAppCard.module.scss';

interface Props {
  readonly app: AiAppWithDoc;
  readonly canManage: boolean;
  readonly onSelect: () => void;
  readonly onEdit: () => void;
  readonly onDeployment: () => void;
  readonly onLogs: () => void;
  readonly onDelete: () => void;
  readonly onViewOnePager: () => void;
}

export function AiAppCard({ app, canManage, onSelect, onEdit, onDeployment, onLogs, onDelete, onViewOnePager }: Props) {
  const isDraft = app.status === 'DRAFT';
  // Two separate questions. "Did the last deploy fail" decides whether we show a
  // notice; "is anything serving" decides whether the app reads as unavailable.
  // An app that rolled back is still working, so it must not look broken.
  const deployFailed = app.status === 'ERROR';
  const serving = app.deployment?.serving ?? 'latest';
  const isUnavailable = serving === 'none';
  const isStale = deployFailed && serving === 'previous';
  // A rolled-back app works fine, so only its creator needs telling that the
  // latest change didn't ship — to a visitor it's an ordinary, working app. An
  // app with nothing serving is broken for everyone, so everyone sees that.
  const showNotice = isUnavailable || (isStale && canManage);
  const hasOnePager = !!app.onePager;
  // Anyone who can see the app gets the "App Details" footer button to open the
  // 1-pager. Creators also get the ⋯ manage menu in the corner — the two are
  // distinct actions (view the doc vs. manage the app).
  const showOnePagerButton = hasOnePager;

  /**
   * The line under the author. It replaces dev's "Deployed <date>" rather than
   * sitting beside it: both answer "when did this last change", and the update
   * note answers it better — a relative time reads at a glance, and it can name
   * the person, which a deploy date can't.
   *
   * The name appears ONLY when the last push wasn't the creator's. Repeating
   * "Polina Bublii" on two adjacent lines is noise; the collaborator case is
   * the whole reason the line carries a name at all.
   *
   * Draft and never-deployed keep dev's wording — an app that has never run has
   * no meaningful "updated", and dating a change to a version nobody can open
   * would be worse than saying nothing.
   */
  const updateNote = (() => {
    if (isDraft) return `Draft created ${new Date(app.createdAt).toLocaleDateString()}`;
    if (isUnavailable) return 'Never deployed';
    if (!app.lastUpdate) return `Deployed ${new Date(app.createdAt).toLocaleDateString()}`;
    const { byUid, byName, minutesAgo } = app.lastUpdate;
    const when = formatMinutesAgo(minutesAgo);
    if (byUid === app.member.uid) return `Updated ${when}`;
    // No "·" between the name and the time: the line is a sentence, not a list,
    // and it is long enough to wrap inside a card — a separator left at the end
    // of the first line reads as a stray dot rather than punctuation.
    //
    // The name and the timestamp are each atomic, so the two legal break points
    // are after "Updated by" and before the time. Without that, a 156px card
    // column splits the collaborator's name down the middle ("Updated by Daniel
    // / Singer 2h ago"), which is the one thing this line exists to say.
    return (
      <>
        Updated by <span className={s.noBreak}>{byName}</span> <span className={s.noBreak}>{when}</span>
      </>
    );
  })();

  /**
   * Activity. Views are public: in a sandbox of terse one-line descriptions,
   * "is anyone actually using this" is the only signal a browser has, and it's
   * the thing an author currently has no way to learn.
   *
   * The second metric counts feedback items, but the card calls it **activity**.
   * On a card the word "feedback" is read as a verdict — a high number looks
   * like a pile of complaints and a low one like nobody cared, neither of which
   * is what the number means. "Activity" says the same thing about engagement
   * without grading the app. The field stays `feedback` because that is what it
   * counts; only the label is broader.
   *
   * It is manager-only either way: to the person who has to answer it, it's a
   * queue. Dev already scopes the feedback view to authors and admins, so the
   * count follows it.
   *
   * Note the label is only on the *metric*. The action keeps its own word —
   * "Give feedback" is what the button does, and you cannot give activity.
   */
  // Labels are lowercase, unlike the notification footer's "42 Views" — casing
  // belongs to the caller, not to DetailsItem, and a Title Case word mid-card
  // beside sentence-case description text reads as a heading that isn't one.
  const metrics = app.activity
    ? [
        { icon: <EyeIcon width={16} height={13} />, value: formatCount(app.activity.views), label: 'views' },
        ...(canManage && app.activity.feedback > 0
          ? [{ icon: <CommentIcon width={14} height={14} />, value: String(app.activity.feedback), label: 'activity' }]
          : []),
      ]
    : [];

  // The whole card is clickable, so it's a role="button" div (a real <button>
  // can't wrap the nested "App details" button). Mirror button keyboard support.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article className={`${s.root} ${isUnavailable ? s.rootFailed : ''} ${showNotice ? s.rootNotice : ''}`}>
      <div className={s.cardButton} role="button" tabIndex={0} onClick={onSelect} onKeyDown={handleKeyDown}>
        {/* Status banner across the top of the card. It gets its own row rather
            than a slot in the footer, whose single action slot already belongs
            to "App Details" — so the two never compete for the same space. */}
        {showNotice && (
          <div className={`${s.failStrip} ${isUnavailable ? s.failStripDanger : s.failStripWarning}`}>
            <span className={s.failStripLabel}>{isUnavailable ? 'Deploy failed' : "Latest deploy didn't ship"}</span>
            {/* Creator-only — the logs are internal. */}
            {canManage && (
              <button
                type="button"
                className={s.seeLogsButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onLogs();
                }}
              >
                See logs
              </button>
            )}
          </div>
        )}

        <div className={s.body}>
          <div className={`${s.nameRow} ${canManage ? s.nameRowMenu : ''}`}>
            <h3 className={s.name}>{app.name}</h3>
            {isDraft && <span className={s.draftBadge}>Draft</span>}
          </div>
          <p className={s.description}>{app.description}</p>

          {/* Sits inside the body, bound to the description by its 8px gap:
              activity is a property of the app, answering "is this worth
              opening" right after "what is it" — not a fact about the author,
              which is what the footer holds. */}
          {metrics.length > 0 && (
            <div className={`${nf.details} ${s.metricsRow}`}>
              {metrics.map((m) => (
                <DetailsItem key={m.label} data={m} showIcon showLabel />
              ))}
            </div>
          )}
        </div>

        <div className={s.footer}>
          <div className={s.author}>
            <img className={s.avatar} src={getDefaultAvatar(app.member.name)} alt="" width={20} height={20} />
            <div className={s.authorText}>
              <p className={s.authorLine}>
                <span className={s.creatorTitle}>by</span> <span className={s.creatorName}>{app.member.name}</span>
              </p>
              <p className={s.deployed}>{updateNote}</p>
            </div>
          </div>

          {showOnePagerButton && (
            <Button
              size="xxs"
              style="border"
              variant="neutral"
              className={s.detailsButton}
              onClick={(e) => {
                e.stopPropagation();
                onViewOnePager();
              }}
              aria-label={`App details for ${app.name}`}
            >
              <DocumentIcon aria-hidden />
              App Details
            </Button>
          )}
        </div>
      </div>

      {canManage && (
        <div className={s.actionSlot}>
          <AppActionsMenu
            appName={app.name}
            onEdit={onEdit}
            onDeployment={onDeployment}
            onLogs={onLogs}
            onDelete={onDelete}
          />
        </div>
      )}
    </article>
  );
}
