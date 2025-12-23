import { useToggle } from 'react-use';

import { Button } from '@/components/common/Button';
import { ArrowUpRightIcon } from '@/components/icons';

import { PostTipsModal } from './components/PostTipsModal';

import s from './PostFormEditorLabel.module.scss';

export function PostFormEditorLabel() {
  const [open, toggleOpen] = useToggle(false);

  return (
    <>
      Post
      <Button style="link" className={s.btn} onClick={toggleOpen}>
        Quick Tips for Great Posts
        <ArrowUpRightIcon width={20} height={20} />
      </Button>
      <PostTipsModal open={open} onClose={toggleOpen} />
    </>
  );
}
