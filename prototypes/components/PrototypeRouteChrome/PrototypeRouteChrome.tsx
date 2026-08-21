import s from './PrototypeRouteChrome.module.scss';

/**
 * Marks the document as "a prototype route is mounted" so the stylesheet beside
 * this file can hide the production header and mobile bottom bar the root layout
 * renders around every prototype.
 *
 * It is an element rather than a class on <body> because it has to disappear on
 * its own when the route unmounts — see the comment in the stylesheet. Rendered
 * once, from app/prototypes/layout.tsx.
 */
export function PrototypeRouteChrome() {
  return <div className={s.marker} data-prototype-chrome aria-hidden="true" />;
}
