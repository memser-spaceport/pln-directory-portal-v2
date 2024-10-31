# Directory Frontend

This is the frontend for the Directory application, uses  [Next.js](https://nextjs.org/) framework and is bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


## Next.js Version

This project is using Next.js version **14.2.3**.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/)

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
- **public/**: Contains static assets such as images, fonts, and other resources.
- **__tests__/**: Contains test files for the application. And its maintains the same folder structure as components.


# Follow the below Steps to run the Directory Frontend

### Step 1: Make sure to have the following applications are setup and running


- [Privy](https://www.privy.io/) - register an app and get the `PRIVY_AUTH_ID`. 
- [Auth Sandbox API](https://github.com/memser-spaceport/auth-sandbox-api) running locally on port 3000. Make sure to have the Privy configured in the Auth Sandbox API. More details [here](https://github.com/memser-spaceport/auth-sandbox-api/blob/main/README.md).
- [Directory API](https://github.com/memser-spaceport/pln-directory-portal) running locally on port 3001 and make sure to register as client in Auth Sandbox API and get the AUTH_APP_CLIENT_ID
- Husky API is available and configured for the Auth Sandbox API.
- [PostHog](https://posthog.com/) (optional, for analytics) - Register an app and get the `POSTHOG_KEY` and `POSTHOG_HOST`



### Step 2: Set up the environment variables

Make sure to set up your environment variables in a `.env` file at the root of the project. This file should contain all necessary environment variables required for the application to run properly. Here are the key variables you need to define:

```dotenv
# Directory API
DIRECTORY_API_URL=<directory-api-url>

# Auth API and Client ID
AUTH_API_URL=<auth-api-url>
AUTH_APP_CLIENT_ID=<auth-app-client-id>
PRIVY_AUTH_ID=<privy-auth-id>
COOKIE_DOMAIN=localhost

# Application Base URL (This will be the URL of the Directory Frontend)
APPLICATION_BASE_URL=http://localhost:4200

# HUSKY
HUSKY_API_URL=<husky-sandbox-api-url>

# PostHog (Optional)
POSTHOG_KEY=<posthog-key>
POSTHOG_HOST=<posthog-host>
```


### Step 3: Run the Directory Frontend

Open the terminal and run the following command:

```bash
npm run dev
```

Application will be running on [http://localhost:4200](http://localhost:4200)


## Running Tests

To run the tests, use the following command:

```bash
npm run test
```



