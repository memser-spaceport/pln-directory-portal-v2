import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { ITag } from '@/types/teams.types';
import React, { Fragment, memo } from 'react';

/**
 * TeamsTagsList Component
 * @param {Object} props - Component properties
 * @param {ITag[]} props.tags - Array of tag objects
 * @param {number} props.noOfTagsToShow - Number of tags to display initially
 * @returns {JSX.Element} A list of tags with tooltips
 */
const TeamsTagsList = (props: any) => {
  const tags = props?.tags ?? [];
  const noOfTagsToShow = props?.noOfTagsToShow ?? 2;

  return (
    <React.Fragment>
      <div className="tagsContainer" data-testid="tags-container">
        {tags?.slice(0, noOfTagsToShow).map((tag: ITag, index: number) => (
          <Fragment key={tag.title}>
            <Tooltip
              asChild
              trigger={
                <div className="tagsContainer__tag" data-testid={`tag-${index}`}>
                  <Tag value={tag?.title} variant="primary" tagsLength={tags?.length} />{' '}
                </div>
              }
              content={tag?.title}
            />
          </Fragment>
        ))}
        {tags?.length > noOfTagsToShow && (
          <Tooltip
            asChild
            trigger={
              <div className="tagsContainer__additionalTags" data-testid="additional-tags">
                <Tag variant="primary" value={'+' + (tags?.length - noOfTagsToShow).toString()}></Tag>{' '}
              </div>
            }
            content={
              <div>
                {tags?.slice(noOfTagsToShow, tags?.length).map((tag: ITag, index: number) => (
                  <div key={tag.title} className="tagsContainer__additionalTag" data-testid={`additional-tag-${index}`}>
                    {tag?.title}
                    {index !== tags?.slice(noOfTagsToShow, tags?.length - 1)?.length ? ',' : ''}
                  </div>
                ))}
              </div>
            }
          />
        )}
      </div>
      <style jsx>{`
        .tagsContainer {
          display: flex;
          gap: 8px;
          height: 26px;
        }

        @media (min-width: 1024px) {
          .tagsContainer {
            margin-left: 0;
          }
        }
      `}</style>
    </React.Fragment>
  );
}

export default TeamsTagsList;
