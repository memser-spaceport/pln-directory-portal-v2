import { Tag } from '@/components/ui/Tag';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

import s from './TagsOverflow.module.scss';

interface Props {
  titles: string[];
  className?: string;
}

export function TagsOverflow(props: Props) {
  const { titles, className } = props;

  return (
    <CustomTooltip
      forceTooltip
      trigger={
        <div>
          <Tag variant="primary" value={`+${titles.length}`} className={className} />
        </div>
      }
      content={
        <div className={s.content}>
          {titles.map((title, index) => (
            <div key={title}>{index < titles.length - 1 ? `${title},` : title}</div>
          ))}
        </div>
      }
    />
  );
}
