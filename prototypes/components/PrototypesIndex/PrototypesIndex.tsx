import { PrototypeBanner } from '@/prototypes/components/PrototypeBanner/PrototypeBanner';
import { getPrototypesByCategory } from '@/prototypes/registry';
import type { PrototypeListGroup } from '@/prototypes/types';
import { PrototypesBrowser } from './PrototypesBrowser';
import s from './PrototypesIndex.module.scss';

export function PrototypesIndex() {
  // Strip the non-serializable `load` function before handing the list to the
  // client-side search/browse component.
  const groups: PrototypeListGroup[] = getPrototypesByCategory().map((group) => ({
    category: group.category,
    items: group.items.map(({ key, title, description, category }) => ({ key, title, description, category })),
  }));

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

        <PrototypesBrowser groups={groups} />
      </div>
    </>
  );
}
