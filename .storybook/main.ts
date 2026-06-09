import path from 'path';
import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../**/*.mdx', '../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    // 1. Алиас
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        styles: path.resolve(__dirname, '../styles'),
        // next/config was removed in Next.js 16; stub it for @storybook/nextjs-vite
        'next/config': path.resolve(__dirname, './next-config-mock.js'),
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
