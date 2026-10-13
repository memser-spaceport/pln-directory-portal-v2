'use client';

interface IKudosPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Numbered pages for the shared board. The server caps the board, so every page gets its own button. */
export default function KudosPagination({ page, totalPages, onPageChange }: IKudosPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pager" aria-label="Kudos board pages">
      <button
        type="button"
        className="pager__step"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>
      {pages.map((n) => (
        <button
          key={n}
          type="button"
          className={`pager__num${n === page ? ' pager__num--active' : ''}`}
          onClick={() => onPageChange(n)}
          aria-label={`Page ${n}`}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}
      <span className="pager__summary" aria-hidden>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="pager__step"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next ›
      </button>
      <style jsx>{`
        .pager {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 28px;
        }
        .pager__num,
        .pager__step {
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #334155;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.15s,
            border-color 0.15s;
        }
        .pager__num:hover:not(.pager__num--active),
        .pager__step:not(:disabled):hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .pager__num:focus-visible,
        .pager__step:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(27, 84, 255, 0.35);
        }
        .pager__num--active {
          background: #1b54ff;
          border-color: #1b54ff;
          color: white;
          cursor: default;
        }
        .pager__step:disabled {
          color: #cbd5e1;
          cursor: not-allowed;
        }
        .pager__summary {
          display: none;
          padding: 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
        /* Too narrow for a row of ten numbers: step through with Prev/Next instead. */
        @media (max-width: 640px) {
          .pager__num {
            display: none;
          }
          .pager__summary {
            display: inline;
          }
        }
      `}</style>
    </nav>
  );
}
