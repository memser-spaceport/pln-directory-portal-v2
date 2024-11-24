# Commit Guidelines

## Purpose
This document outlines the guidelines for writing clear and concise commit messages. Following these guidelines will help maintain a clean and understandable project history.

## Commit Message Structure
A commit message should consist of three parts:
1. **Title**: A brief summary of the changes (50 characters or less).
2. **Body**: A detailed explanation of the changes (optional).
3. **Footer**: Any additional information, such as issue references (optional).

### Example
```
feat: Add user authentication

Implemented user authentication using JWT. Updated the login and registration endpoints to handle token generation and validation.

Fixes #123
```

## Guidelines
1. **Use the imperative mood**: Write the title as if you are giving an order (e.g., "Add feature" instead of "Added feature").
2. **Keep it short**: Limit the title to 50 characters or less.
3. **Separate subject from body**: Use a blank line between the title and the body.
4. **Explain why, not just what**: If writing a body, explain the reasons behind the changes.
5. **Reference issues**: If applicable, reference relevant issues or tickets in the footer.

## Types of Changes
Use the following prefixes to categorize your commits:
- `build` – changes that affect the build system or external dependencies;
- `chore` – changes that do not relate to a fix or feature and don't modify src or test files (for example updating dependencies);
- `ci` – continuous integration related;
- `docs` – updates to documentation such as a the README or other markdown files;
- `feat` – a new feature is introduced with the changes;
- `fix` – a bug fix has occurred;
- `perf` – performance improvements;
- `refactor` – refactored code that neither fixes a bug nor adds a feature;
- `revert` – reverts a previous commit;
- `style` – changes that do not affect the meaning of the code, likely related to code formatting such as white-space, missing semi-colons, and so on;
- `test` – including new or correcting previous tests.

## Additional Tips
- Commit often with small, manageable changes.
- Avoid committing generated files or dependencies.
- Review your changes before committing to ensure they are necessary and complete.

By following these guidelines, you will contribute to a more maintainable and understandable codebase.
