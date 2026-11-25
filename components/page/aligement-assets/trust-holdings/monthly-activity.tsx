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

// One footnote per distinct note, in first-seen order, so a line can carry
// the marker(s) for the note(s) that explain it.
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

// A month's NAV bridge plus the simplified contributions & expenses view —
// both read from the same reconciliation, so nothing is counted twice.
// Separate from the asset values in the row above, never folded into NAV.
// Styles live in trust-holdings.tsx with the rest of the table's.
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
        <p className="th-ce__title">NAV Reconciliation</p>
        <p className="th-ce__note">No trust statement has been published for {month} yet.</p>
      </div>
    );
  }

  const r = reconciliation;
  const { notes, markers } = footnotesFor(r.lines);

  return (
    <div className="th-ce">
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
