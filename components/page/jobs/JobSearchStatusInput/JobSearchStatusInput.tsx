'use client';

import clsx from 'clsx';

import { JOB_SEARCH_STATUS_OPTIONS, type JobSearchStatus } from '@/services/jobs/job-board-viewer';

import s from './JobSearchStatusInput.module.scss';

interface JobSearchStatusInputProps {
  value: JobSearchStatus | null;
  onChange: (next: JobSearchStatus) => void;
  /**
   * The radio group's `name`. Defaulted, because for a long time there was only
   * one of these on any page and the name was a literal.
   *
   * It is a prop now because there are two hosts: the profile step and the
   * sign-up form. They are never on screen together — the flow renders one step
   * at a time — so nothing is broken today. But two radios sharing a `name` are
   * one group as far as the browser is concerned, and a bug whose symptom is
   * "the other card's answer cleared itself" is not one anybody enjoys finding.
   */
  name?: string;
}

/**
 * Where a member is with job hunting — one of three, chosen once.
 *
 * **Its own module, and that is the point.** This lived inside
 * `JobProfileDrawer.tsx`, which is fine while the profile step is the only thing
 * that asks the question. The sign-up form asks it too now, and that form is
 * deliberately a light chunk: the controller loads `JobProfileDrawer` through
 * `dynamic({ ssr: false })` precisely so a logged-out visitor never downloads
 * the member-editing stack, and a static import from the sign-up modal would
 * have pulled all of it back in. (`JobSignUpModal` already copies
 * `EditInvestorProfileDrawer`'s back glyph rather than importing it, for exactly
 * this reason, and says so.)
 *
 * So the component moved down here where both hosts can reach it, taking its own
 * stylesheet with it — those rules had one consumer and it was this.
 *
 * Deliberately uncontrolled by any form library: it is a plain value/onChange
 * pair, so the profile step can drive it from a member record and the sign-up
 * form can drive it from react-hook-form without either shape leaking into the
 * other.
 */
export function JobSearchStatusInput({ value, onChange, name = 'job-search-status' }: JobSearchStatusInputProps) {
  return (
    <div className={s.statusRoot}>
      {/* The pill carries the audience; this line carries the purpose. */}
      <p className={s.statusPrivacyNote}>Used to decide whether to surface your profile to founders who are hiring.</p>

      <div className={s.statusOptions} role="radiogroup" aria-label="Job search status">
        {JOB_SEARCH_STATUS_OPTIONS.map((option) => (
          <label key={option.value} className={clsx(s.statusOption, { [s.statusOptionOn]: value === option.value })}>
            <input
              type="radio"
              name={name}
              className={s.statusInput}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={s.statusIndicator} aria-hidden="true" />
            <span className={s.statusText}>
              <span className={s.statusLabel}>{option.label}</span>
              <span className={s.statusHint}>{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
