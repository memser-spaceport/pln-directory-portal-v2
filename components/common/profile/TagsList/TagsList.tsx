import { Tag } from '@/components/ui/Tag';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

interface Props {
  tags: { title: string; color?: string }[];
  tagsToShow?: number;
}

export function TagsList(props: Props) {
  const { tags, tagsToShow = 3 } = props;

  const tagsNum = tags?.length || 0;

  return (
    <>
      {tags?.slice(0, tagsToShow).map((tag, index) => {
        const { title, color } = tag;

        return (
          <CustomTooltip
            key={`${tag} + ${index}`}
            forceTooltip
            trigger={
              <div>
                <Tag value={title} color={color} tagsLength={tagsNum} />
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
              <Tag variant="primary" value={'+' + (tagsNum - tagsToShow).toString()} />
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
    </>
  );
}
