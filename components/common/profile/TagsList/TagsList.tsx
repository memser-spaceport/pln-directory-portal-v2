import clsx from 'clsx';

import { Tag } from '@/components/ui/Tag';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

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
        <CustomTooltip
          forceTooltip
          trigger={
            <div>
              <Tag variant="primary" value={'+' + (tagsNum - tagsToShow).toString()} className={classes?.tag} />
            </div>
          }
          content={
            <div>
              {tags
                ?.slice(tagsToShow, tagsNum)
                .map((tag) => tag?.title)
                .join(',|')
                .split('|')
                .map((tag) => <div key={tag}>{tag}</div>)}
            </div>
          }
        />
      )}
    </div>
  );
}
