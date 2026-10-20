## 1. Feedback drawer

- [x] 1.1 Flatten and upload each drawn-on screenshot of LabOS feedback; keep the raw screenshot and drawing data (screenshot-feedback.test.ts)
- [x] 1.2 Skip the flatten for a screenshot with no drawings, and send the raw screenshot when the flatten or its upload fails (screenshot-feedback.test.ts)
- [x] 1.3 Lock the page sent by the drawer and the help-menu support form (give-ai-app-feedback-dialog.test.tsx, contact-support.test.tsx)

## 2. Checks

- [x] 2.1 Run npm run lint and npm run test
- [x] 2.2 Run openspec validate --strict --json
