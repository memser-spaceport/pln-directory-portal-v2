import { ReactNode } from 'react';

export const STEPS: { title: string; description: ReactNode }[] = [
  { title: 'Download Template', description: 'Click the button below to get your workspace package.' },
  {
    title: 'Open Locally',
    description: (
      <>
        Unzip the folder and open it in your preferred setup (Claude Code, Cursor, etc.). If you are migrating an
        existing app, copy your project files into the <strong>app</strong> folder so your agent can work alongside the
        included deploy instructions.
      </>
    ),
  },
  {
    title: 'Build or Migrate',
    description:
      "For a new app, prompt your agent to develop it using the integrated instructions. For an existing app, point your agent at your code and the template's deploy config to wire it into LabOS infra.",
  },
  {
    title: 'Deploy',
    description: 'Ask your agent to deploy when ready (for example, "Deploy this to labs").',
  },
];
