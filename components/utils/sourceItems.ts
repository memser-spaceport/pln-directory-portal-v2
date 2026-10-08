import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

interface SourceItem {
  key: string;
  href: string;
  title: string;
}

export function sourceItems(sources: string[] | undefined, sourceRefs: HuskySourceRef[] | undefined): SourceItem[] {
  if (sourceRefs?.length) {
    return sourceRefs.flatMap((ref) => {
      const href = ref.directoryLink || ref.externalUrl;
      if (!href) {
        return [];
      }
      return [{ key: String(ref.index), href, title: ref.title || href }];
    });
  }
  return (sources ?? []).map((source, index) => ({ key: String(index), href: source, title: source }));
}
