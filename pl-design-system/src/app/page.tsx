import styles from './page.module.scss';

const uiComponents = [
  'Accordion', 'Alert', 'Avatar', 'Badge', 'Button', 'Carousel', 'Checkbox',
  'ContextMenu', 'DatePicker', 'Drawer', 'Dropdown', 'EmptyState', 'Input',
  'Lightbox', 'Pagination', 'Progress', 'SearchInput', 'Slider', 'Steps',
  'Switch', 'Table', 'Tabs', 'Textarea', 'Toggle', 'Tooltip', 'Upload',
];

const layoutComponents = [
  'BottomNav', 'NavBar', 'PageHeader', 'Sidebar',
];

const cardComponents = [
  'CTACard', 'FocusAreaCard', 'ForumPostCard', 'MemberCard', 'OfficeHoursCard', 'TeamCard',
];

const pageTemplates = [
  { name: 'Home', path: '/templates/home', description: 'Dashboard with CTA cards, Focus Areas, and Recent Updates feed' },
  { name: 'Forum', path: '/templates/forum', description: 'Forum listing with tabs, sort, and post cards' },
  { name: 'Deals', path: '/templates/deals', description: 'Deals browser with filter sidebar and deal cards' },
  { name: 'Member Profile', path: '/templates/member-profile', description: 'Individual member profile with bio, teams, experience' },
  { name: 'Team Profile', path: '/templates/team-profile', description: 'Organization profile with fund details, membership sources' },
];

export default function ShowcasePage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>PL Design System</h1>
        <p className={styles.subtitle}>
          Protocol Labs · Components &amp; tokens extracted from Figma
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Page Templates</h2>
        <p className={styles.sectionDesc}>Full page compositions assembled from design system components.</p>
        <ul className={styles.templateGrid}>
          {pageTemplates.map((t) => (
            <li key={t.path}>
              <a href={t.path} className={styles.templateCard}>
                <span className={styles.templateName}>{t.name}</span>
                <span className={styles.templateDesc}>{t.description}</span>
                <span className={styles.templateArrow}>→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>UI Components</h2>
        <ul className={styles.grid}>
          {uiComponents.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.cardName}>{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Layout &amp; Navigation</h2>
        <ul className={styles.grid}>
          {layoutComponents.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.cardName}>{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cards</h2>
        <ul className={styles.grid}>
          {cardComponents.map((name) => (
            <li key={name} className={styles.card}>
              <span className={styles.cardName}>{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Design Tokens</h2>
        <div className={styles.tokenPreview}>
          <div className={styles.swatch} style={{ background: 'var(--foreground-brand-primary)' }}>
            <span>brand/primary</span>
          </div>
          <div className={styles.swatch} style={{ background: 'var(--background-neutral-soft-surface)', color: 'var(--foreground-neutral-primary)' }}>
            <span>neutral/soft</span>
          </div>
          <div className={styles.swatch} style={{ background: 'var(--background-brand-soft-surface)', color: 'var(--foreground-brand-primary)' }}>
            <span>brand/soft</span>
          </div>
          <div className={styles.swatch} style={{ background: 'var(--global-color-slate-900)', color: '#fff' }}>
            <span>slate/900</span>
          </div>
        </div>
      </section>
    </main>
  );
}
