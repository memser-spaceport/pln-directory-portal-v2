import path from 'path';
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  viteFinal: async (config) => {
    // 1. Алиас
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        styles: path.resolve(__dirname, '../styles'),
      },
    };

    // 2. includePaths для SCSS
    config.css = {
      ...config.css,
      preprocessorOptions: {
        scss: {
          ...(config.css?.preprocessorOptions?.scss ?? {}),
          includePaths: [path.resolve(__dirname, '../')],
        },
      },
    };

    return config;
  },
};
export default config;
