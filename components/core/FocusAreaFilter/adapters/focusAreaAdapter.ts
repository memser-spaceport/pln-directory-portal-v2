import { IFocusArea } from '@/types/shared.types';
import { TreeFilterItem } from '../types';

export interface FocusAreaTreeItem extends TreeFilterItem {
  children: FocusAreaTreeItem[];
  raw: IFocusArea;
}

export function toTreeFilterItems(focusAreas: IFocusArea[]): FocusAreaTreeItem[] {
  return focusAreas.map((fa) => ({
    id: fa.uid,
    label: fa.title,
    parentId: fa.parentUid || undefined,
    description: fa.description,
    children: fa.children ? toTreeFilterItems(fa.children) : [],
    raw: fa,
  }));
}

export function getCountForKey(key: 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas') {
  return (item: FocusAreaTreeItem): number => {
    return item.raw[key]?.length ?? 0;
  };
}
