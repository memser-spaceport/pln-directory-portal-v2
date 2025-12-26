import { ReactNode } from 'react';

export interface ISubItem {
  readonly href: string;
  readonly title: string;
  readonly icon?: ReactNode;
  readonly description?: string;
}
