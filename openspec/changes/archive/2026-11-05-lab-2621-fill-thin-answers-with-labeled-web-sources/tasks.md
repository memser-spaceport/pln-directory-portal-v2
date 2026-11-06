## 1. Sources list

- [x] 1.1 Group the source items into "Directory" and "Web"; verify with the source item tests
- [x] 1.2 Show the groups in the AI Search page sources popup; verify with `__tests__/page/husky/ai-search-answer-sources.test.tsx`
- [x] 1.3 Show the groups in the header dialog sources card; verify with the source card tests

## 2. Analytics

- [x] 2.1 Add `unified-search-ai-web-sources-shown` and `unified-search-ai-web-source-clicked`; verify with the analytics tests

## 3. Checks

- [x] 3.1 Run `npm run lint` and `npm run test`
- [x] 3.2 Run `openspec validate lab-2621-fill-thin-answers-with-labeled-web-sources --strict --json`
