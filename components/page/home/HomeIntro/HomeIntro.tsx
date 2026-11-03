import s from './HomeIntro.module.scss';

export const HOME_HEADING = 'Protocol Labs Directory';

/** What the network and this directory are, for a visitor (or a search engine) who has never heard of either. */
export const HOME_DEFINITION =
  'Protocol Labs is an innovation network driving breakthroughs in computing to push humanity forward. This directory ' +
  'maps the network: the teams, members and projects working on AI and robotics, neurotech, digital human rights, ' +
  'and economies and governance. Use it to see who builds what, follow team updates, find events and browse open roles.';

/**
 * The page's one `<h1>` (LAB-3089), for screen readers and search engines: the top of `/home` keeps its design, so it
 * is not drawn. A visually hidden heading is ordinary accessible markup, not hidden text; the definition, which is
 * content, stays visible in `HomeAbout` at the foot of the page.
 */
export function HomeIntro() {
  return <h1 className={s.srOnly}>{HOME_HEADING}</h1>;
}

/**
 * What the network is, for a signed-out visitor, as a quiet "About" line at the foot of `/home` (LAB-3089). Visible on
 * purpose: text shown only to crawlers is what Google's spam policies call hidden text.
 */
export function HomeAbout() {
  return (
    <section className={s.about} aria-labelledby="home-about-title">
      <h2 id="home-about-title" className={s.heading}>
        About {HOME_HEADING}
      </h2>
      <p className={s.definition}>{HOME_DEFINITION}</p>
    </section>
  );
}
