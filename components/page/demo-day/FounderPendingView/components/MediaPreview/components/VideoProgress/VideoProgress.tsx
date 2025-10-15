import { getVideoDataStorageKey } from '@/components/common/VideoPlayer';

import s from './VideoProgress.module.scss';

interface Props {
  src: string;
}

export function VideoProgress(props: Props) {
  const { src } = props;

  const progressKey = getVideoDataStorageKey(src, 'progress');
  const watchedKey = getVideoDataStorageKey(src, 'watched');
  const lengthKey = getVideoDataStorageKey(src, 'length');

  const length = localStorage.getItem(lengthKey);
  const watched = localStorage.getItem(watchedKey);
  const progress = localStorage.getItem(progressKey);

  const progressInPercents = (() => {
    if (watched) {
      return 100;
    }

    if (progress && length) {
      return Math.ceil((100 * parseFloat(progress)) / parseFloat(length));
    }

    return 0;
  })();

  return (
    <div className={s.root}>
      <div
        className={s.progress}
        style={{
          width: `calc(${progressInPercents}% - 20px)`,
        }}
      />
    </div>
  );
}
