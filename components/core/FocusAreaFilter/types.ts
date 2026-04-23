export interface TreeFilterItem {
  id: string;
  label: string;
  parentId?: string;
  description?: string;
  children: TreeFilterItem[];
}
