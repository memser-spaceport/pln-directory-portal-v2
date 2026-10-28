import coreWebVitals from 'eslint-config-next/core-web-vitals';
import storybook from 'eslint-plugin-storybook';

const SANITIZE_HINT = 'Render member/AI HTML with SafeHtml (@/components/ui/SafeHtml) or sanitizeHtml (@/utils/html).';

export default [
  { ignores: ['pl-design-system/**'] },
  ...coreWebVitals,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },
  // Member- and AI-written HTML reaches the page only through utils/html's
  // sanitizer: SafeHtml, safeHtmlProps or parseSafeHtml.
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react/no-danger': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'dompurify', message: SANITIZE_HINT },
            { name: 'isomorphic-dompurify', message: SANITIZE_HINT },
            { name: 'html-react-parser', message: 'Use parseSafeHtml from @/utils/html.' },
          ],
        },
      ],
    },
  },
  {
    files: ['utils/html/**', '__tests__/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // Mocked data, off in production (prototypes/README.md).
  {
    files: ['prototypes/**', 'design-canvas/**'],
    rules: { 'react/no-danger': 'off', 'no-restricted-imports': 'off' },
  },
];
