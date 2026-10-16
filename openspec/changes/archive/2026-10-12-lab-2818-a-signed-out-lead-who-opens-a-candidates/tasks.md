# Tasks

## 1. Signed-out path

- [x] 1.1 Build the sign-in redirect for a signed-out visitor from the team id and the `role`, `candidate` and `suggested` fields only; verify with a unit test
- [x] 1.2 Send a signed-out visitor to that redirect when the Candidates feature is on, and to the team profile when it is off; verify with unit tests
- [x] 1.3 Keep the rule for a signed-in person who is not on the team; verify that the existing gate tests pass

## 2. Checks

- [x] 2.1 Run `npm run lint` and `npm run test`
- [x] 2.2 Run `openspec validate lab-2818-a-signed-out-lead-who-opens-a-candidates --strict --json`
