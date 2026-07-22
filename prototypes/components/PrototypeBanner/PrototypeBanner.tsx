import Link from 'next/link';
import s from './PrototypeBanner.module.scss';
import { CommentLayerMount } from '@/prototypes/comment-layer/CommentLayerMount';

type Props = {
  title?: string;
};

export function PrototypeBanner({ title }: Props) {
  return (
    <>
      <CommentLayerMount />
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
