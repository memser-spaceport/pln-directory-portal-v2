import { usePathname } from 'next/navigation';

export type DemoDayMode = 'prep' | 'showcase' | null;

export type DemoDayModeType = 'prep' | 'showcase';

export function useDemoDayMode(): DemoDayMode {
  const pathname = usePathname();
  if (pathname?.includes('/showcase') || pathname?.includes('plf25-demosc')) return 'showcase';
  if (pathname?.includes('/prep') || pathname?.includes('plf25-prep')) return 'prep';
  return null;
}
