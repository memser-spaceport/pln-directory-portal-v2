'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs } from '@/components/common/Tabs';
import s from './GantryTabs.module.scss';

const tabs = [
  { value: 'ideas', label: 'Ideas' },
  { value: 'roadmap', label: 'Roadmap' },
] as const;

export function GantryTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const value = pathname.startsWith('/gantry/roadmap') ? 'roadmap' : 'ideas';

  return (
    <div className={s.tabs}>
      <Tabs
        tabs={tabs.map((tab) => ({ value: tab.value, label: tab.label }))}
        value={value}
        variant="underline"
        classes={{
          root: s.tabsRoot,
          list: s.tabsList,
        }}
        onValueChange={(nextValue) => router.push(`/gantry/${nextValue}`)}
      />
    </div>
  );
}
