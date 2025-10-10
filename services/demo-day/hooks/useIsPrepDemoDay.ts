import { usePathname } from 'next/navigation';

export function useIsPrepDemoDay(): boolean {
  const pathname = usePathname();
  return pathname?.includes('plf25-prep') ?? false;
}
