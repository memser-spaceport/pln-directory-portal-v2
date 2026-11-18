'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import np from '@/components/page/news-preferences/NewsPreferences.module.scss';
import { groupNewsTags } from '@/components/page/news-preferences/newsTagThemes';
import { useNewsTags } from '@/services/team-news/hooks/useNewsTags';

import { CheckIcon, PlusIcon } from './DigestTopicIcons';

import sb from './DigestSidebar.module.scss';
import s from './DigestTopicsModal.module.scss';

type Props = {
  followed: string[];
  canSave: boolean;
  onClose: () => void;
  onSave: (next: string[]) => Promise<boolean>;
};

/**
 * All topics (LAB-3289, the digest-web prototype's AllTopicsModal): the house modal (common `Modal` with
 * SubmitDealModal's chrome) holding News preferences' tag picker: a search, every tag in its themes, its chips.
 * Picks are a draft until Save; Cancel, ✕ and Esc throw them away. Mounted only while open, so each opening starts
 * from what's saved. A failed save keeps the modal open with the picks.
 */
export function DigestTopicsModal({ followed, canSave, onClose, onSave }: Props) {
  const { data: tagGroups, isPending, isError } = useNewsTags();
  const [draft, setDraft] = useState<string[]>(followed);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const changed = draft.length !== followed.length || draft.some((t) => !followed.includes(t));

  // Every choosable tag, plus the ones the member follows that the list lacks (no recent news), so they can untick them.
  const themes = useMemo(() => {
    const listed = (tagGroups ?? []).flatMap((group) => [group.slug, ...group.children.map((child) => child.slug)]);
    return groupNewsTags([...new Set([...followed, ...listed])], query);
  }, [tagGroups, followed, query]);

  const toggle = (slug: string) =>
    setDraft((prev) => (prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]));

  const save = async () => {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen onClose={onClose} ariaLabelledBy="digest-topics-modal-title" lockScroll inertBackground>
      <div className={clsx(dealModal.root, s.root)}>
        <div className={dealModal.header}>
          <div className={dealModal.headerText}>
            <h2 id="digest-topics-modal-title" className={dealModal.title}>
              Your topics{draft.length > 0 && ` · ${draft.length}`}
            </h2>
            <p className={dealModal.subtitle}>Ticked topics shape your digest and For You on Home.</p>
          </div>
          <button type="button" className={dealModal.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={clsx(dealModal.content, s.content)}>
          <SearchInput value={query} onChange={setQuery} placeholder="Search topics" className={s.search} />
          {isPending && !tagGroups ? (
            <p className={s.empty}>Loading topics…</p>
          ) : isError && !tagGroups ? (
            <p className={s.empty}>We couldn’t load the topics. Please try again later.</p>
          ) : themes.length === 0 ? (
            <p className={s.empty}>
              No topics match “{query.slice(0, 30)}”.{' '}
              <button type="button" className={np.inlineLink} onClick={() => setQuery('')}>
                Show all topics
              </button>
            </p>
          ) : (
            // News preferences' themed rows: skim a group instead of reading every chip. Fixed order: a chip never
            // moves when it's ticked or unticked.
            <div className={s.tagGroups}>
              {themes.map((theme) => (
                <div key={theme.title} className={s.tagGroup}>
                  <p className={s.tagGroupLabel}>{theme.title}</p>
                  <div className={np.chips} role="group" aria-label={theme.title}>
                    {theme.slugs.map((slug) => {
                      const on = draft.includes(slug);
                      return (
                        <button
                          key={slug}
                          type="button"
                          className={clsx(np.chip, on && np.chipOn)}
                          aria-pressed={on}
                          title={on ? `Unsubscribe from #${slug}` : `Subscribe to #${slug}`}
                          onClick={() => toggle(slug)}
                        >
                          {on ? <CheckIcon /> : <PlusIcon />}#{slug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={clsx(dealModal.footer, s.footer)}>
          <div className={dealModal.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button size="s" className={sb.glossy} disabled={!changed || !canSave || saving} onClick={save}>
              Save topics
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
