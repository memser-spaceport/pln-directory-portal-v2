'use client';

/**
 * COPY-SIMPLIFY of production's `settings-back-btn.tsx`. Production dispatches a
 * `settings-navigate` CustomEvent that the active tab's content component picks
 * up and turns into a `router.push('/settings')`; here it's a callback. Markup
 * and styled-jsx are verbatim.
 *
 * Only rendered below 1024px — `page.module.css .privacy__backbtn` is
 * `display: none` at desktop, where the rail is always visible instead.
 */
export function SettingsBackButtonMock({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <>
      <div className="sb">
        <button type="button" className="sb__link" onClick={onBack} aria-label="Back to account settings">
          <img width="16px" height="16px" alt="" src="/icons/arrow-left-blue.svg" />
        </button>
        <p>{title}</p>
      </div>
      <style jsx>
        {`
          .sb {
            position: relative;
            width: 100%;
            height: 48px;
            background: #fff;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 12px;
            color: #475569;
            font-size: 18px;
            font-style: normal;
            font-weight: 500;
            line-height: 27px; /* 135% */
            letter-spacing: -0.4px;
          }
          .sb__link {
            display: flex;
            gap: 4px;
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
            background: none;
            border: 0;
            padding: 0;
            cursor: pointer;
          }
        `}
      </style>
    </>
  );
}
