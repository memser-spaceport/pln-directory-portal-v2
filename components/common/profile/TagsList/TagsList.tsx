import clsx from 'clsx';

import { Tag } from '@/components/ui/Tag';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import { TagsOverflow } from '../TagsOverflow';

import s from './TagsList.module.scss';

interface Props {
  tags: { title: string; color?: string }[];
  tagsToShow?: number;
  classes?: {
    root?: string;
    tag?: string;
  };
}

export function TagsList(props: Props) {
  const { tags, classes, tagsToShow = 3 } = props;

  const tagsNum = tags?.length || 0;

  return (
    <div className={clsx(s.root, classes?.root)}>
      {tags?.slice(0, tagsToShow).map((tag, index) => {
        const { title, color } = tag;

        return (
          <CustomTooltip
            key={`${tag} + ${index}`}
            forceTooltip
            trigger={
              <div>
                <Tag value={title} color={color} tagsLength={tagsNum} className={classes?.tag} />
              </div>
            }
            content={<div>{title}</div>}
          />
        );
      })}

      {tagsNum > tagsToShow && (
        <TagsOverflow titles={tags.slice(tagsToShow).map((tag) => tag.title)} className={classes?.tag} />
      )}
    </div>
  );
}
