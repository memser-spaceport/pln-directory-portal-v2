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
- **\_\_tests\_\_/**: Contains test files for the application. And its maintains the same folder structure as components.


# Steps to run directory frontend service locally

### Dependent services:

| Name                      | Type     | Purpose                                                           | Mandatory |
|---------------------------|----------|-------------------------------------------------------------------|-----------|
| [Privy](https://www.privy.io/)                    | External | The hybrid auth solution provider for users to login               | Yes       |
| [PostHog](https://posthog.com/)                  | External | For analytics purpose                                             | No        |
| [Directory Backend](https://github.com/memser-spaceport/pln-directory-portal)        | Internal | For communicating to the directory database through REST API       | Yes       |
| Husky (sandbox mode)       | Internal | To leverage the AI assist feature                                 | No        |
| PL Auth service (sandbox mode) | Internal | To manage user auth requests and issue tokens, works in OAuth 2.0 standard | Yes       |


### Step 1: Install dependencies

To install the dependencies use the below command

```dotenv
npm install
```

### Step 2: Create the env file

Use the below command to create .env using .env.example

```dotenv
cp .env.example .env
```
### Step 3: Setup env variables

Set the env variables based on the instructions provided in the .env.example file.

For *local development* use the test values mentioned in the comments for each env variable.

### Step 4: Run the Directory Frontend

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


# Steps to run directory admin frontend service locally

#### This app is used by admin to approve/reject/edit people and team join requests.

Follow the instructions [here](https://github.com/memser-spaceport/pln-directory-portal) to setup and run the directory admin frontend.