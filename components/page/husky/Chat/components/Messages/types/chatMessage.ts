import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

export interface IChatMessage {
  id: string;
  question: string;
  answer: string;
  followUpQuestions: string[];
  sources?: string[];
  sourceRefs?: HuskySourceRef[];
  actions: Array<{ name: string; type: string; directoryLink: string }>;
  sql: Array<{ name: string; type: string; source: string }>;
  isError?: boolean;
  feedback?: { rating: number };
}
