import { usePathname } from 'next/navigation';

export function useIsPrepDemoDay(): boolean {
  const pathname = usePathname();
  return (
    (pathname?.includes('plf25-prep') ||
      pathname?.includes('plf25-demosc') ||
      pathname?.includes('/showcase') ||
      pathname?.includes('/prep')) ??
    false
  );
}
