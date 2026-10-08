'use client';

/**
 * Every token used under .plaa-home must be declared here: pl-design-system/ is not built,
 * so an undeclared var(--pl-…) silently resets (the prospect banner once went white-on-white).
 */
export default function PlaaHomeTokens() {
  return (
    <style jsx global>{`
      .plaa-home {
        --color-brand: #0b4f66;
        --color-brand-text: #094157;
        --color-brand-subtle: #e6f1f5;
        --color-chart: #365a83;
        --surface-card: #ffffff;
        --surface-page: #f8fafc;
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-tertiary: #64748b;
        --border-faint: #eef2f6;
        --border-subtle: #e2e8f0;
        --pl-blue-25: #f7fafd;
        --pl-blue-50: #eff6ff;
        --pl-blue-200: #bcd4f0;
        --pl-blue-300: #90b6e4;
        --pl-blue-400: #4f86c6;
        --pl-blue-500: #156ff7;
        --pl-blue-600: #1d4ed8;
        --pl-green-500: #30c593;
        --pl-green-600: #0a9952;
        --pl-slate-50: #f8fafc;
        --pl-slate-300: #cbd5e1;
        --pl-slate-600: #475569;
        --pl-slate-800: #1e293b;
        --pl-slate-900: #0f172a;
        --pl-purple-500: #8b5cf6;
        --radius-md: 8px;
        --radius-lg: 10px;
        --radius-xl: 14px;
        --radius-2xl: 18px;
        --radius-3xl: 24px;
        --ring-hairline: 0 0 0 1px rgba(15, 23, 42, 0.07);
        --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
        --shadow-sm: 0 2px 6px rgba(15, 23, 42, 0.06);
        --shadow-lg: 0 12px 28px rgba(15, 23, 42, 0.16);
        --shadow-3xl: 0 24px 64px rgba(15, 23, 42, 0.24);
        --text-display-sm: 600 30px/1.2 'Inter', sans-serif;
        --text-heading-lg: 600 24px/1.3 'Inter', sans-serif;
        --text-heading-md: 600 19px/1.35 'Inter', sans-serif;
        --text-heading-sm: 600 16px/1.4 'Inter', sans-serif;
        --text-body-lg: 400 16px/1.55 'Inter', sans-serif;
        --text-body-md: 400 14px/1.55 'Inter', sans-serif;
        --text-body-sm: 400 12px/1.55 'Inter', sans-serif;
        --text-label-lg: 500 14px/1.4 'Inter', sans-serif;
        --text-label-md: 500 12px/1.4 'Inter', sans-serif;
        --text-label-sm: 500 11px/1.4 'Inter', sans-serif;

        color: var(--text-primary);
        font-family: 'Inter', sans-serif;
        width: 100%;
        max-width: none;
        margin: 0;
        --plaa-home-gutter: clamp(16px, 3vw, 56px);
        padding: clamp(20px, 2.4vw, 36px) var(--plaa-home-gutter) 64px;
        overflow-x: hidden;
      }

      .plaa-home h1,
      .plaa-home h2,
      .plaa-home h3,
      .plaa-home p {
        margin: 0;
      }

      .plaa-home button {
        font-family: inherit;
      }

      @media (max-width: 768px) {
        .plaa-home {
          --plaa-home-gutter: 16px;
          padding: 20px var(--plaa-home-gutter) 48px;
        }
      }
    `}</style>
  );
}
