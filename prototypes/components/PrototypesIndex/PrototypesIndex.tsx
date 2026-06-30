import { PrototypeBanner } from '@/prototypes/components/PrototypeBanner/PrototypeBanner';
import { getPrototypesByCategory } from '@/prototypes/registry';
import { PrototypeCard } from './PrototypeCard';
import s from './PrototypesIndex.module.scss';

export function PrototypesIndex() {
  const groups = getPrototypesByCategory();

  return (
    <>
      <PrototypeBanner />
      <div className={s.root}>
        <header className={s.header}>
          <h1 className={s.title}>AI prototypes</h1>
          <p className={s.subtitle}>
            Interactive UI previews for exploring new ideas. Each prototype uses mocked data and is isolated from
            production features.
          </p>
        </header>

        {groups.map((group) => (
          <section key={group.category} className={s.section}>
            <h2 className={s.sectionTitle}>
              {group.category}
              {group.category === 'Ideation' && <span className={s.sectionDraftNote}>Drafts — work in progress</span>}
            </h2>
            <div className={s.grid}>
              {group.items.map((entry) => (
                <PrototypeCard key={entry.key} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
