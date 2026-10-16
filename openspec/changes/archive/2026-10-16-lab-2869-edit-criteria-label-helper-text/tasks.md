## 1. Prompt box label and helper text

- [x] 1.1 Change the box label to "Help us suggest better members for <role title>." with the fallback "this role"; verify with the Jest tests in `__tests__/page/team-details/edit-criteria-modal.test.tsx`
- [x] 1.2 Add the helper text "Tell the AI who you're looking for" under the label and add it to the box's aria-describedby next to the counter; verify with a Jest test that reads the box's accessible description
- [x] 1.3 Update the tests that find the box by the old label (`edit-criteria-modal.test.tsx`, `team-applicants-suggested.test.tsx`); verify with `npx jest __tests__/page/team-details`

## 2. Checks

- [x] 2.1 Run `npm run lint` and `npm run test`; verify both pass under the build's base-red rules
- [x] 2.2 Run `npx -y @fission-ai/openspec@1.14.1 validate lab-2869-edit-criteria-label-helper-text --strict --json`; verify `valid` is true
