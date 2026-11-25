import { Fragment, ReactNode } from 'react';
import { ACTIVITY_CATEGORIES, Cents, MonthReconciliation, ReconciliationLine } from './reconciliation/reconciliation';

const dollars = (cents: Cents) =>
  `$${(Math.abs(cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// U+2212, not a hyphen — lines up with the plus sign in tabular figures.
export const formatSigned = (cents: Cents | null) => {
  if (cents == null) return '—';
  return `${cents < 0 ? '−' : '+'}${dollars(cents)}`;
};

export const formatBalance = (cents: Cents) => `${cents < 0 ? '−' : ''}${dollars(cents)}`;

const toneOf = (cents: Cents | null) => {
  if (cents == null) return 'th-ce__amount--none';
  return cents < 0 ? 'th-ce__amount--out' : 'th-ce__amount--in';
};

const signedCell = (cents: Cents | null) => (
  <td className={toneOf(cents)}>
    {cents == null ? <span aria-label="No reported activity">—</span> : formatSigned(cents)}
  </td>
);

function footnotesFor(lines: ReconciliationLine[]) {
  const notes: string[] = [];
  const markers = new Map<string, number[]>();
  lines.forEach((line) => {
    if (line.status === 'verified') return;
    const own = line.notes.length ? line.notes : ['Classification pending review.'];
    markers.set(
      line.key,
      own.map((note) => {
        if (!notes.includes(note)) notes.push(note);
        return notes.indexOf(note) + 1;
      }),
    );
  });
  return { notes, markers };
}

function Section({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <section className="th-ce__section">
      <p className="th-ce__title">{title}</p>
      <table className="th-ce__table">
        <caption className="th-ce__caption">{caption}</caption>
        {children}
      </table>
    </section>
  );
}

function MonthlyActivityStyles() {
  return (
    <style jsx global>{`
      /* Sticky-left keeps the panel in view when the wide table is scrolled
           sideways on small screens. */
      .th-ce {
        position: sticky;
        left: 0;
        box-sizing: border-box;
        max-width: min(1040px, 100cqw);
        padding: 4px 24px 20px 58px;
      }

      .th-ce__title {
        margin: 0 0 6px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #0c5259;
      }

      .th-ce__sections {
        display: grid;
        gap: 20px 48px;
      }

      @container (min-width: 820px) {
        .th-ce__sections {
          grid-template-columns: 1fr 1fr;
          align-items: start;
        }
      }

      .th-ce__review {
        margin: 0 0 10px;
        font-size: 12px;
        line-height: 17px;
        color: #b45309;
      }

      .th-ce__marker {
        margin-left: 2px;
        font-size: 9px;
        font-weight: 700;
        color: #b45309;
      }

      .th-ce__caption {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      .th-ce__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .th-table .th-ce__table th,
      .th-table .th-ce__table td {
        padding: 9px 0;
        border-bottom: 1px solid #e2e8f0;
        background: none;
        text-align: left;
      }

      .th-table .th-ce__table thead th {
        padding: 6px 0;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8897ae;
      }

      .th-table .th-ce__table thead th:last-child,
      .th-table .th-ce__table td {
        text-align: right;
      }

      .th-table .th-ce__table tbody th {
        padding-right: 16px;
        white-space: normal;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: normal;
        text-transform: none;
        color: #455468;
      }

      .th-table .th-ce__table td {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .th-table .th-ce__table tbody tr:last-child th,
      .th-table .th-ce__table tbody tr:last-child td {
        border-bottom: none;
      }

      .th-table td.th-ce__amount--in {
        color: #16a34a;
      }

      .th-table td.th-ce__amount--out {
        color: #b42318;
      }

      .th-table td.th-ce__amount--none {
        font-weight: 400;
        color: #8897ae;
      }

      .th-table .th-ce__table tr.th-ce__row--group th,
      .th-table .th-ce__table tr.th-ce__row--group td {
        padding-top: 12px;
        font-weight: 600;
        color: #0a0c11;
      }

      .th-table .th-ce__table tr.th-ce__row--item th {
        padding-left: 14px;
      }

      .th-table .th-ce__table tr.th-ce__row--context td {
        padding: 6px 0 9px 14px;
        text-align: left;
        white-space: normal;
        font-size: 12px;
        font-weight: 400;
        color: #64748b;
      }

      .th-table .th-ce__table tr.th-ce__row--balance th,
      .th-table .th-ce__table tr.th-ce__row--balance td {
        font-weight: 700;
        color: #0a0c11;
      }

      /* An inset shadow, not border-top — in a collapsed table the row
           above's border-bottom wins the shared edge. */
      .th-table .th-ce__table tr.th-ce__row--close th,
      .th-table .th-ce__table tr.th-ce__row--close td {
        box-shadow: inset 0 1px 0 #94a3b8;
      }

      .th-table .th-ce__table tr.th-ce__row--flag th,
      .th-table .th-ce__table tr.th-ce__row--flag td {
        color: #b45309;
      }

      .th-ce__footnotes {
        margin: 12px 0 0;
        padding-left: 16px;
        font-size: 12px;
        line-height: 17px;
        color: #64748b;
      }

      .th-ce__footnotes li::marker {
        color: #b45309;
        font-weight: 700;
      }

      .th-ce__note {
        margin: 10px 0 0;
        font-size: 12px;
        line-height: 17px;
        color: #8897ae;
      }

      @media (max-width: 768px) {
        .th-ce {
          padding: 4px 16px 16px 40px;
        }
      }

      /* Sized to the visible table area, not the viewport — the page's own
           gutters leave far less than 100vw on a phone. */
      @container (max-width: 360px) {
        .th-ce {
          padding: 4px 12px 14px 16px;
        }

        .th-table .th-ce__table th,
        .th-table .th-ce__table td,
        .th-table .th-ce__table tbody th {
          font-size: 12px;
        }

        .th-table .th-ce__table tbody th {
          padding-right: 8px;
        }
      }
    `}</style>
  );
}

export default function MonthlyActivity({
  month,
  reconciliation,
}: {
  month: string;
  reconciliation?: MonthReconciliation;
}) {
  if (!reconciliation) {
    return (
      <div className="th-ce">
        <MonthlyActivityStyles />
        <p className="th-ce__title">NAV Reconciliation</p>
        <p className="th-ce__note">No trust statement has been published for {month} yet.</p>
      </div>
    );
  }

  const r = reconciliation;
  const { notes, markers } = footnotesFor(r.lines);

  return (
    <div className="th-ce">
      <MonthlyActivityStyles />
      {r.needsReview && (
        <p className="th-ce__review">
          {r.balanced
            ? 'Some movements are inferred rather than stated on the statement — see notes below.'
            : `Does not reconcile — ${formatSigned(r.difference)} unaccounted for. Flagged for review.`}
        </p>
      )}

      <div className="th-ce__sections">
        <Section title="NAV Reconciliation" caption={`NAV reconciliation for ${month}`}>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="th-ce__row--balance">
              <th scope="row">Opening NAV ({r.openingDate})</th>
              <td>{formatBalance(r.openingNav)}</td>
            </tr>
            {r.groups.map((group) => (
              <Fragment key={group.key}>
                <tr className="th-ce__row--group">
                  <th scope="row">{group.label}</th>
                  <td>{formatSigned(group.subtotal)}</td>
                </tr>
                {group.lines.map((line) => (
                  <Fragment key={line.key}>
                    <tr className="th-ce__row--item">
                      <th scope="row">
                        {line.label}
                        {markers.get(line.key)?.map((n) => (
                          <sup key={n} className="th-ce__marker" aria-label={`Note ${n}`}>
                            {n}
                          </sup>
                        ))}
                      </th>
                      {signedCell(line.amount)}
                    </tr>
                    {line.category === 'spvContribution' && r.spvOwnership && (
                      <tr className="th-ce__row--context">
                        <td colSpan={2}>
                          Trust&rsquo;s Class B interest in PL Venture Holdings: {r.spvOwnership.classBPercent}%
                          {r.spvOwnership.priorClassBPercent && ` (from ${r.spvOwnership.priorClassBPercent}%)`}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Fragment>
            ))}
            {!r.balanced && (
              <tr className="th-ce__row--flag">
                <th scope="row">Reconciliation Difference</th>
                <td>{formatSigned(r.difference)}</td>
              </tr>
            )}
            <tr className="th-ce__row--balance th-ce__row--close">
              <th scope="row">Closing NAV ({r.closingDate})</th>
              <td>{formatBalance(r.closingNav)}</td>
            </tr>
          </tbody>
        </Section>

        <Section title="Contributions & Expenses" caption={`Contributions and expenses for ${month}`}>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY_CATEGORIES.map(({ key, label }) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                {signedCell(r.activity[key])}
              </tr>
            ))}
            <tr className="th-ce__row--balance th-ce__row--close">
              <th scope="row">Net Financial Activity</th>
              <td>{formatSigned(r.netActivity)}</td>
            </tr>
          </tbody>
        </Section>
      </div>

      {notes.length > 0 && (
        <ol className="th-ce__footnotes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ol>
      )}
      <p className="th-ce__note">
        Opening and closing NAV are the total account values on the trust&rsquo;s monthly statement and can differ from
        the estimated NAV in the table. Financial activity reflects transactions recorded in that statement.
      </p>
    </div>
  );
}
