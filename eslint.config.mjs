import coreWebVitals from 'eslint-config-next/core-web-vitals';
import storybook from 'eslint-plugin-storybook';

export default [
  ...coreWebVitals,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },
];
