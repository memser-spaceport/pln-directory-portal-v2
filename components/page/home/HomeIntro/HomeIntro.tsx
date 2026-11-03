import s from './HomeIntro.module.scss';

export const HOME_HEADING = 'Protocol Labs Directory';

/** What the network and this directory are, for a visitor (or a search engine) who has never heard of either. */
export const HOME_DEFINITION =
  'Protocol Labs is an innovation network driving breakthroughs in computing to push humanity forward. This directory ' +
  'maps the network: the teams, members and projects working on AI and robotics, neurotech, digital human rights, ' +
  'and economies and governance. Use it to see who builds what, follow team updates, find events and browse open roles.';

interface Props {
  /** Signed-out visitors see the definition; signed-in members, who know the network, get the heading for screen readers only. */
  showDefinition: boolean;
}

/**
 * The page's one `<h1>` and, for a signed-out visitor, a definition of the network (LAB-3089). Quiet on purpose: a
 * small label and a muted paragraph above the welcome card, so the feed stays the first thing anyone reads.
 */
export function HomeIntro({ showDefinition }: Props) {
  if (!showDefinition) {
    return <h1 className={s.srOnly}>{HOME_HEADING}</h1>;
  }
  return (
    <header className={s.intro}>
      <h1 className={s.heading}>{HOME_HEADING}</h1>
      <p className={s.definition}>{HOME_DEFINITION}</p>
    </header>
  );
}
