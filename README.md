# Directory Frontend

This is the frontend for the Directory application, uses  [Next.js](https://nextjs.org/) framework and is bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Version

This project is using Next.js version **14.2.3**.

## Folder Structure

The folder structure of this project is organized as follows:

- **app/**: Contains the main application files, including pages and layout components.
- **components/**: Contains reusable components categorized into:
  - **ui/**: Pure components that are reusable and do not manage state.
  - **core/**: Components used across multiple pages, such as navigation bars and footers.
  - **form/**: Components specifically designed for form handling and input.
  - **page/**: Components that are specific to individual pages.

- **services/**: Contains service files that handle API calls and business logic.
- **utils/**: Utility functions that can be used throughout the application.
- **analytics/**: Contains files related to analytics tracking and reporting.


## Environment Variables

Make sure to set up your environment variables in a `.env` file at the root of the project. This file should contain all necessary environment variables required for the application to run properly. Here are the key variables you need to define:

```dotenv
# Directory API
DIRECTORY_API_URL=<directory-api-url>

# Auth API and Client ID
AUTH_API_URL=<auth-api-url>
AUTH_APP_CLIENT_ID=<auth-app-client-id>
PRIVY_AUTH_ID=<privy-auth-id>
COOKIE_DOMAIN=localhost

# Application Base URL
APPLICATION_BASE_URL=http://localhost:4200

# HUSKY
HUSKY_API_URL=<husky-api-url>

# PostHog
POSTHOG_KEY=<posthog-key>
POSTHOG_HOST=<posthog-host>
```


## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:4200](http://localhost:4200) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Running Tests

To run the tests, use the following command:

```bash
npm run test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!


