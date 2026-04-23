import { ReactNode } from 'react';

export interface ISubItem {
  readonly href: string;
  readonly title: string;
  readonly icon?: ReactNode;
  readonly description?: string;
  /** When set, items with the same value are grouped under a labeled subsection in the menu */
  readonly section?: string;
}
