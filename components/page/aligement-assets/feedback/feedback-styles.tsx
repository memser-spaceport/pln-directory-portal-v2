'use client';

/**
 * Feedback Board styles.
 *
 * Design references (per the vault's design-references pattern):
 * - Linear — near-zero-chrome surfaces; hierarchy from spacing and weight
 *   alone, almost no borders or fills. This is an Operate surface: a long list
 *   people scan, so rows are separated by one hairline and nothing else.
 * - Aura — restrained palette and generous whitespace so the one thing that
 *   matters per row is the only thing competing for attention. Here that is the
 *   title; the vote count is the only accent.
 *
 * Brand primary #1B4CFE per §6, white surfaces, near-black text, no yellow
 * except as a status tint. Tokens come from the Directory shell where they
 * exist, so the page reads as one site.
 */
export default function FeedbackStyles() {
  return (
    <style jsx global>{`
      .fb-page {
        --fb-brand: #1b4cfe;
        --fb-brand-dark: #133cc4;
        --fb-ink: #0f172a;
        --fb-muted: #64748b;
        /* Dimmer than --fb-muted but still AA on a tinted chip (4.58:1). */
        --fb-muted-strong: #5b6878;
        --fb-hairline: #e2e8f0;
        --fb-surface: #ffffff;
        --fb-raised: #f8fafc;

        /* 90% of the shell, with a ceiling so the Ideas rows don't stretch to
           an unreadable line length on a wide monitor. */
        width: 90%;
        max-width: 1440px;
        margin: 0 auto;
        padding: 32px 20px 96px;
        color: var(--fb-ink);
      }

      .fb-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* ---------- header ---------- */
      .fb-page__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .fb-page__title {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin: 0 0 6px;
      }
      .fb-page__intro {
        margin: 0;
        color: var(--fb-muted);
        font-size: 15px;
        max-width: 52ch;
      }

      /* ---------- buttons ---------- */
      .fb-btn {
        appearance: none;
        border: 0;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          color 0.15s ease;
      }
      .fb-btn--sm {
        padding: 6px 10px;
        font-size: 13px;
      }
      .fb-btn--primary {
        background: var(--fb-brand);
        color: #fff;
      }
      .fb-btn--primary:hover:not(:disabled) {
        background: var(--fb-brand-dark);
      }
      .fb-btn--ghost {
        background: transparent;
        color: var(--fb-ink);
        box-shadow: inset 0 0 0 1px var(--fb-hairline);
      }
      .fb-btn--ghost:hover:not(:disabled) {
        background: var(--fb-raised);
      }
      .fb-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .fb-btn:focus-visible,
      .fb-tabs__tab:focus-visible,
      .fb-vote:focus-visible,
      .fb-row__title:focus-visible,
      .fb-card__title:focus-visible,
      .fb-linkbtn:focus-visible {
        outline: 2px solid var(--fb-brand);
        outline-offset: 2px;
      }
      .fb-linkbtn {
        background: none;
        border: 0;
        /* WCAG 2.5.8: the hit area clears 24px even though the text is 13px. */
        padding: 6px 2px;
        min-height: 24px;
        font-size: 13px;
        color: var(--fb-muted);
        cursor: pointer;
        text-decoration: underline;
      }

      /* ---------- tabs ---------- */
      .fb-tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--fb-hairline);
        margin-bottom: 20px;
        overflow-x: auto;
      }
      .fb-tabs__tab {
        appearance: none;
        background: none;
        border: 0;
        min-height: 44px;
        padding: 12px 14px;
        font-size: 14px;
        font-weight: 600;
        color: var(--fb-muted);
        cursor: pointer;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
      }
      .fb-tabs__tab--active {
        color: var(--fb-brand);
        border-bottom-color: var(--fb-brand);
      }

      /* ---------- filters ---------- */
      .fb-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .fb-select {
        appearance: none;
        border-radius: 8px;
        border: 1px solid var(--fb-hairline);
        background: var(--fb-surface);
        padding: 8px 30px 8px 12px;
        font-size: 14px;
        color: var(--fb-ink);
        cursor: pointer;
        background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
          linear-gradient(135deg, currentColor 50%, transparent 50%);
        background-position:
          calc(100% - 16px) calc(50% + 1px),
          calc(100% - 11px) calc(50% + 1px);
        background-size: 5px 5px;
        background-repeat: no-repeat;
      }

      /* ---------- list rows (Linear: one hairline, no card chrome) ---------- */
      .fb-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .fb-row {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 16px 4px;
        border-bottom: 1px solid var(--fb-hairline);
      }
      .fb-row:last-child {
        border-bottom: 0;
      }
      .fb-row__main {
        flex: 1;
        min-width: 0;
      }
      .fb-row__title {
        display: block;
        font-size: 15px;
        font-weight: 600;
        color: var(--fb-ink);
        text-decoration: none;
        margin-bottom: 6px;
      }
      .fb-row__title:hover {
        color: var(--fb-brand);
      }
      .fb-row__meta {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        font-size: 13px;
        color: var(--fb-muted);
      }
      .fb-row__age,
      .fb-row__comments {
        font-size: 13px;
        color: var(--fb-muted);
        white-space: nowrap;
      }
      .fb-row--triage {
        align-items: center;
      }
      .fb-row__linear {
        font-size: 13px;
      }

      /* ---------- vote ---------- */
      .fb-vote {
        flex: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 48px;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid var(--fb-hairline);
        background: var(--fb-surface);
        color: var(--fb-muted);
        cursor: pointer;
        font-variant-numeric: tabular-nums;
      }
      .fb-vote:hover:not(:disabled) {
        border-color: var(--fb-brand);
        color: var(--fb-brand);
      }
      .fb-vote--on {
        border-color: var(--fb-brand);
        background: #eef2ff;
        color: var(--fb-brand);
      }
      .fb-vote:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .fb-vote__arrow {
        font-size: 10px;
        line-height: 1;
      }
      .fb-vote__count {
        font-size: 14px;
        font-weight: 700;
      }

      /* ---------- badges ---------- */
      .fb-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }
      .fb-badge--slate {
        background: #f1f5f9;
        color: #475569;
      }
      .fb-badge--blue {
        background: #eef2ff;
        color: #1b4cfe;
      }
      .fb-badge--amber {
        background: #fef3c7;
        color: #92400e;
      }
      .fb-badge--green {
        background: #dcfce7;
        color: #166534;
      }
      .fb-badge--muted {
        background: #f1f5f9;
        /* #94a3b8 measured 2.34:1 here and failed AA. */
        color: var(--fb-muted-strong);
      }
      .fb-badge--type {
        background: transparent;
        box-shadow: inset 0 0 0 1px var(--fb-hairline);
        color: var(--fb-muted);
      }

      /* ---------- empty / loading / error ---------- */
      .fb-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 56px 20px;
        text-align: center;
      }
      .fb-empty__text {
        margin: 0;
        color: var(--fb-muted);
        font-size: 15px;
      }
      .fb-skeletons {
        display: grid;
        gap: 12px;
      }
      .fb-skeleton {
        height: 64px;
        border-radius: 8px;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
        background-size: 400% 100%;
        animation: fb-shimmer 1.4s ease infinite;
      }
      @keyframes fb-shimmer {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }

      /* ---------- roadmap ---------- */
      .fb-board__tabs {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        margin-bottom: 14px;
      }
      .fb-board__tab {
        appearance: none;
        border: 1px solid var(--fb-hairline);
        background: var(--fb-surface);
        border-radius: 999px;
        /* Thumb-sized: this is the only way to change column on a phone. */
        min-height: 44px;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 600;
        color: var(--fb-muted);
        white-space: nowrap;
        cursor: pointer;
      }
      .fb-board__tab--active {
        background: var(--fb-brand);
        border-color: var(--fb-brand);
        color: #fff;
      }
      .fb-board__columns {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        align-items: start;
      }
      .fb-board__columns--single {
        grid-template-columns: minmax(0, 1fr);
      }
      .fb-col {
        background: var(--fb-raised);
        border-radius: 12px;
        padding: 14px 12px;
        min-width: 0;
      }
      .fb-col__head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }
      .fb-col__title {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--fb-muted);
      }
      .fb-col__count {
        font-size: 12px;
        font-weight: 600;
        color: var(--fb-muted);
        font-variant-numeric: tabular-nums;
      }
      .fb-col__sub {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--fb-muted);
      }
      .fb-col__empty {
        margin: 14px 0;
        font-size: 13px;
        color: var(--fb-muted);
      }
      .fb-col__list {
        list-style: none;
        margin: 12px 0 0;
        padding: 0;
        display: grid;
        gap: 10px;
      }
      .fb-card {
        background: var(--fb-surface);
        border-radius: 10px;
        padding: 12px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
      }
      .fb-card__badges {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .fb-card__title {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--fb-ink);
        text-decoration: none;
        margin-bottom: 10px;
      }
      .fb-card__title:hover {
        color: var(--fb-brand);
      }
      .fb-card__foot {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .fb-card__comments {
        font-size: 13px;
        color: var(--fb-muted);
      }
      .fb-card__moved {
        margin: 10px 0 0;
        font-size: 12px;
        color: var(--fb-muted);
      }

      /* ---------- move to ---------- */
      .fb-moveto {
        position: relative;
      }
      .fb-moveto__panel {
        position: absolute;
        z-index: 20;
        top: calc(100% + 6px);
        left: 0;
        width: 240px;
        background: var(--fb-surface);
        border-radius: 10px;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.08),
          0 12px 32px rgba(15, 23, 42, 0.14);
        padding: 8px;
        display: grid;
        gap: 4px;
      }
      .fb-moveto__option {
        appearance: none;
        border: 0;
        background: none;
        text-align: left;
        min-height: 40px;
        padding: 10px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        color: var(--fb-ink);
      }
      .fb-moveto__option:hover {
        background: var(--fb-raised);
      }
      .fb-moveto__option--active {
        background: #eef2ff;
        color: var(--fb-brand);
        font-weight: 600;
      }
      .fb-moveto__field {
        display: grid;
        gap: 4px;
        padding: 6px 2px 0;
      }
      .fb-moveto__actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        padding-top: 6px;
      }

      /* ---------- detail ---------- */
      .fb-detail {
        display: grid;
        gap: 28px;
      }
      .fb-detail__badges {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      .fb-detail__title {
        margin: 0 0 10px;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .fb-detail__byline {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 13px;
        color: var(--fb-muted);
      }
      .fb-detail__body {
        display: grid;
        gap: 14px;
        justify-items: start;
      }
      .fb-detail__description,
      .fb-detail__section p {
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .fb-detail__h2 {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--fb-muted);
      }
      .fb-detail__screenshots {
        margin: 0;
        font-size: 13px;
        color: var(--fb-muted);
      }
      .fb-duplicate {
        padding: 12px 14px;
        border-radius: 8px;
        background: #f1f5f9;
        font-size: 14px;
      }
      .fb-timeline__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 14px;
      }
      .fb-timeline__row {
        display: flex;
        gap: 12px;
      }
      .fb-timeline__dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--fb-brand);
        margin-top: 6px;
        flex: none;
      }
      .fb-timeline__label {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      .fb-timeline__date {
        font-weight: 400;
        color: var(--fb-muted);
      }
      .fb-timeline__note {
        margin: 4px 0 0;
        font-size: 14px;
        color: var(--fb-muted);
      }
      .fb-admin {
        padding: 16px;
        border-radius: 10px;
        background: var(--fb-raised);
      }
      .fb-admin__row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .fb-linear-link {
        font-size: 13px;
        font-weight: 600;
        color: var(--fb-brand);
      }
      .fb-linear-state {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--fb-muted);
      }

      /* ---------- comments ---------- */
      .fb-comments__list {
        list-style: none;
        margin: 0 0 20px;
        padding: 0;
        display: grid;
        gap: 18px;
      }
      .fb-comment__head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }
      .fb-comment__date {
        font-size: 12px;
        color: var(--fb-muted);
      }
      .fb-comment__body {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .fb-comment__hidden {
        margin: 0;
        font-size: 14px;
        font-style: italic;
        color: var(--fb-muted);
      }
      .fb-comment__actions {
        display: flex;
        gap: 12px;
        margin-top: 6px;
      }
      .fb-composer {
        display: grid;
        gap: 10px;
        justify-items: start;
      }

      /* ---------- form ---------- */
      .fb-modal__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 32px 16px;
        overflow-y: auto;
      }
      .fb-modal {
        position: relative;
        width: min(560px, 100%);
        background: var(--fb-surface);
        border-radius: 14px;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.24);
      }
      .fb-modal__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 0;
      }
      .fb-modal__title {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .fb-modal__close {
        appearance: none;
        border: 0;
        background: none;
        font-size: 24px;
        line-height: 1;
        color: var(--fb-muted);
        cursor: pointer;
        min-height: 44px;
        min-width: 44px;
        padding: 4px 8px;
      }
      .fb-form {
        display: grid;
        gap: 16px;
        padding: 18px 20px 20px;
      }
      .fb-field {
        display: grid;
        gap: 6px;
        border: 0;
        padding: 0;
        margin: 0;
      }
      .fb-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--fb-ink);
        padding: 0;
      }
      .fb-input,
      .fb-textarea {
        width: 100%;
        border-radius: 8px;
        border: 1px solid var(--fb-hairline);
        padding: 10px 12px;
        font-size: 14px;
        font-family: inherit;
        color: var(--fb-ink);
        background: var(--fb-surface);
      }
      .fb-input:focus,
      .fb-textarea:focus,
      .fb-select:focus {
        outline: 2px solid var(--fb-brand);
        outline-offset: -1px;
        border-color: var(--fb-brand);
      }
      .fb-textarea {
        resize: vertical;
      }
      .fb-segmented {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .fb-segmented__btn {
        appearance: none;
        border: 1px solid var(--fb-hairline);
        background: var(--fb-surface);
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: 600;
        color: var(--fb-muted);
        cursor: pointer;
      }
      .fb-segmented__btn--active {
        border-color: var(--fb-brand);
        background: #eef2ff;
        color: var(--fb-brand);
      }
      .fb-segmented__btn:focus-visible {
        outline: 2px solid var(--fb-brand);
        outline-offset: 2px;
      }
      .fb-help {
        font-size: 12px;
        color: var(--fb-muted);
      }
      .fb-error {
        font-size: 12px;
        color: #b91c1c;
      }
      .fb-error--block {
        margin: 0;
        font-size: 13px;
      }
      .fb-note {
        margin: 0;
        padding: 10px 12px;
        border-radius: 8px;
        background: #f1f5f9;
        font-size: 13px;
        color: var(--fb-ink);
      }
      .fb-guidelines {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--fb-muted);
      }
      .fb-files {
        list-style: none;
        margin: 4px 0 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }
      .fb-files__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
      }
      .fb-files__name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fb-files__remove {
        appearance: none;
        background: none;
        border: 0;
        min-height: 24px;
        padding: 4px 2px;
        color: var(--fb-muted);
        text-decoration: underline;
        cursor: pointer;
        font-size: 13px;
      }
      .fb-modal__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .fb-confirm {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.96);
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        padding: 24px;
      }
      .fb-confirm__text {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      /* ---------- responsive ---------- */
      @media (max-width: 767px) {
        .fb-page {
          padding: 20px 16px 96px;
        }
        .fb-page__head {
          flex-direction: column;
          gap: 14px;
        }
        /* §6: the primary action stays reachable on a long list. */
        .fb-page__cta {
          position: sticky;
          bottom: 16px;
          z-index: 5;
          width: 100%;
          box-shadow: 0 6px 20px rgba(27, 76, 254, 0.3);
        }
        .fb-row {
          gap: 10px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fb-skeleton {
          animation: none;
        }
        .fb-btn {
          transition: none;
        }
      }
    `}</style>
  );
}
