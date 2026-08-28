import Link from 'next/link';
import s from './PrototypeBanner.module.scss';
import { CommentLayerMount } from '@/prototypes/comment-layer/CommentLayerMount';

// The review-comment widget. On, so reviewers can leave comments on the deployed
// link. It renders as a vertical "Comment" tab on the RIGHT EDGE of the viewport
// with a count badge — not a floating bottom-right button, which is what people
// look for first and don't find.
//
// Comments are shared, not per-browser: the widget is wired to Supabase
// (`pln-prototype-comments`), so two reviewers on the same Vercel link see each
// other's notes. If they ever stop syncing, check the free Supabase project
// hasn't auto-paused after ~7 idle days — opening its dashboard wakes it.
const SHOW_COMMENT_LAYER = true;

type Props = {
  title?: string;
};

export function PrototypeBanner({ title }: Props) {
  return (
    <>
      {SHOW_COMMENT_LAYER && <CommentLayerMount />}
      <div className={s.banner} role="status">
        <div className={s.content}>
          <span className={s.badge}>AI prototype</span>
          <p className={s.text}>
            {title ? (
              <>
                Previewing <strong>{title}</strong> — mocked data only, not connected to production.
              </>
            ) : (
              <>Mocked UI previews for AI-assisted feature exploration. Nothing here affects production.</>
            )}
          </p>
          <Link href="/prototypes" className={s.link}>
            All prototypes
          </Link>
        </div>
      </div>
    </>
  );
}
