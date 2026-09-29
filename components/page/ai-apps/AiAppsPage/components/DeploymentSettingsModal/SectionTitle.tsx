import { ReactNode, SVGProps, useState } from 'react';

import { ChevronDownIcon } from '@/components/icons';

import s from './DeploymentSettingsModal.module.scss';

type SectionIconName = 'build' | 'secrets' | 'endpoints' | 'keys';

export function DisclosureSection({
  icon,
  title,
  children,
}: {
  icon: SectionIconName;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className={s.section}>
      <SectionTitle icon={icon} open={open} onToggle={() => setOpen((value) => !value)}>
        {title}
      </SectionTitle>
      {open ? children : null}
    </section>
  );
}

function SectionTitle({
  icon,
  children,
  open,
  onToggle,
}: {
  icon: SectionIconName;
  children: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const label = (
    <>
      <SectionIcon name={icon} />
      <span className={s.sectionLabel}>{children}</span>
    </>
  );
  if (!onToggle) {
    return <h3 className={s.sectionTitle}>{label}</h3>;
  }
  return (
    <h3 className={s.sectionTitle}>
      <button type="button" className={s.sectionToggle} aria-expanded={open} onClick={onToggle}>
        {label}
        <ChevronDownIcon width={16} height={16} className={open ? s.chevron : s.chevronCollapsed} />
      </button>
    </h3>
  );
}

function SectionIcon({ name }: { name: SectionIconName }) {
  const props: SVGProps<SVGSVGElement> = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    'aria-hidden': true,
  };
  if (name === 'build') {
    return (
      <svg {...props}>
        <path
          d="M2.5 5.25 8 2.25l5.5 3M2.5 5.25 8 8.25l5.5-3M2.5 5.25V10.75L8 13.75l5.5-3V5.25M8 8.25V13.75"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (name === 'secrets') {
    return (
      <svg {...props}>
        <rect x="3.25" y="7" width="9.5" height="6.25" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.25 7V5.25a2.75 2.75 0 0 1 5.5 0V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'endpoints') {
    return (
      <svg {...props}>
        <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M2.75 8h10.5M8 2.75c1.6 1.7 1.6 8.8 0 10.5M8 2.75c-1.6 1.7-1.6 8.8 0 10.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="5.5" cy="6.25" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.6 7.6 13.25 13.25M10.5 10.5l1.75-1.75M12 12l1.25-1.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
