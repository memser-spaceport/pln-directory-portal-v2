'use client';

/**
 * Auth copy audit — a shareable read-only page listing every visible string that
 * needs "log in" → "sign in", plus the identifiers that must NOT be renamed.
 *
 * Content lives in findings.ts and mirrors prototypes/AUTH-COPY-AUDIT.md.
 * No mock product UI here: this is a document, so it is plain semantic markup
 * rather than a reconstruction of any production screen.
 */

import { BRANCH, EXCLUSIONS, FILE_COUNT, ORDER, SECTIONS, SWEPT_ON, TOTAL, type Finding } from './findings';
import s from './AuthCopyAudit.module.scss';

const VERIFY_COMMAND = `rg -n "Log ?[Ii]n|Log ?[Oo]ut|Sign In|Sign Up|Sign Out" --glob '!**/node_modules/**'`;

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <li className={s.finding}>
      <div className={s.findingHead}>
        <span className={s.num}>#{finding.id}</span>
        <span className={s.where}>{finding.where}</span>
        <span className={s.path}>{finding.path}</span>
      </div>

      <div className={s.swap}>
        <span className={s.from}>{finding.current}</span>
        <span className={s.arrow} aria-label="becomes">
          →
        </span>
        <span className={s.to}>{finding.replacement}</span>
      </div>

      {finding.note ? <p className={s.note}>{finding.note}</p> : null}
    </li>
  );
}

export default function AuthCopyAuditPrototype() {
  return (
    <div className={s.page}>
      <div className={s.sheet}>
        <header className={s.card}>
          <h1 className={s.title}>Auth copy audit — “Log in” → “Sign in”</h1>
          <p className={s.lead}>
            Every visible string in the app that needs to change, with file, line, current text and replacement. Nothing
            here is behavioural — each change is a string literal or a JSX text node.
          </p>
          <div className={s.metaRow}>
            <span className={s.stat}>
              <span className={s.statNum}>{TOTAL}</span> strings
            </span>
            <span className={s.stat}>
              <span className={s.statNum}>{FILE_COUNT}</span> files
            </span>
            <span className={s.stat}>Swept {SWEPT_ON}</span>
            <span className={s.stat}>
              branch <span className={s.mono}>{BRANCH}</span>
            </span>
          </div>
        </header>

        <section className={s.card}>
          <h2 className={s.sectionTitle}>The standard</h2>
          <ul className={s.ruleList}>
            <li>
              <strong>Sign in · Sign up · Sign out</strong> — always these verbs, never <em>log in / login / logout</em>
              .
            </li>
            <li>
              <strong>Sentence case</strong> — “Sign in”, not “Sign In”. Applies mid-sentence too: “Sign in to view
              updates”, not “Sign In to View Updates”.
            </li>
            <li>
              <strong>Visible strings only.</strong> Identifiers, routes, events and analytics names are out of scope —
              renaming those breaks deep links and dashboards without changing a single pixel.
            </li>
          </ul>
        </section>

        {SECTIONS.map((section) => (
          <section key={section.key} className={s.card}>
            <h2 className={s.sectionTitle}>
              <span className={s.letter} aria-hidden>
                {section.letter}
              </span>
              {section.title}
              <span className={s.countPill}>
                {section.findings.length} {section.findings.length === 1 ? 'string' : 'strings'}
              </span>
            </h2>
            <p className={s.blurb}>{section.blurb}</p>
            <ul className={s.findings}>
              {section.findings.map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
            </ul>
          </section>
        ))}

        <section className={s.card}>
          <h2 className={s.sectionTitle}>Out of scope — do not rename</h2>
          <p className={s.exclusionIntro}>
            A future sweep will match all of these. They are deliberate exclusions, not misses.
          </p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th} scope="col">
                    What
                  </th>
                  <th className={s.th} scope="col">
                    Where
                  </th>
                  <th className={s.th} scope="col">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {EXCLUSIONS.map((ex) => (
                  <tr key={ex.what}>
                    <td className={`${s.td} ${s.tdWhat}`}>{ex.what}</td>
                    <td className={`${s.td} ${s.mono}`}>{ex.where}</td>
                    <td className={s.td}>{ex.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={s.card}>
          <h2 className={s.sectionTitle}>Suggested order</h2>
          <ol className={s.orderList}>
            {ORDER.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={s.blurb} style={{ marginTop: 16 }}>
            After the sweep, this should return only excluded matches:
          </p>
          <div className={s.verify}>{VERIFY_COMMAND}</div>
        </section>
      </div>
    </div>
  );
}
