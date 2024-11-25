#!/usr/bin/env node

const fs = require('fs');
const isAmended = process.env.GIT_INDEX_FILE !== undefined;

if (isAmended) {
  console.log('Skipping validation for amended commit.');
  process.exit(0);
}

// File containing the commit message
const commitMsgFile = process.argv[2];

// Read the commit message
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

// Define the regex for valid commit messages
// Example: "feat(scope): add new feature"
const validCommitRegex = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test )\([\w\-]+\): .{10,}$/;

if (!validCommitRegex.test(commitMsg)) {
  console.error(`
❌ Invalid commit message!

Format:
  <type>(<scope>): <message>

Examples:
  feat(auth): add login functionality
  fix(cart): resolve checkout issue

Allowed types:
  build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test 

Please update your commit message and try again.
For more details, check the commit message guidelines:
  /docs/GUIDELINES_COMMIT.md
  `);
  process.exit(1); // Exit with error
}

console.log("✅ Commit message is valid!");
process.exit(0); // Exit with success
