## 1. Prompts from the news feed

- [x] 1.1 Select up to 4 prompts from the news feed (Top Stories first, then newest; one per story); verify with `npx jest __tests__/services/team-news/newsPrompts.test.ts`
- [x] 1.2 Load the prompts with a TanStack Query hook keyed by a `TeamNewsQueryKeys` value; verify with `npx jest __tests__/services/team-news/useTeamNewsPrompts.test.tsx`

## 2. New-chat page

- [x] 2.1 Show the news prompts in the "Try asking" block and hide it when there are none; a picked prompt asks AI Search, with the daily limit; verify with `npx jest __tests__/page/husky/ai-search-chat-home.test.tsx __tests__/core/husky/ai-search-new-chat.test.tsx`

## 3. Checks

- [x] 3.1 Run `npm run lint` and `npm run test`
- [x] 3.2 Run `openspec validate lab-3012-try-asking-suggestions-show-old-canned-p --strict --json`
