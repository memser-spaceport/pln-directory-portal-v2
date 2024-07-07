import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { ITag } from '@/types/teams.types';
import React, { Fragment } from 'react';

const TeamsTagsList = (props: any) => {
  const tags = props?.tags ?? [];
  const noOfTagsToShow= props?.noOfTagsToShow ?? 2;
  return (
    <>
      <div className="team-grid__details-container__tagscontainer">
        {tags?.map((tag: ITag, index: number) => (
          <Fragment key={`${tag} + ${index}`}>
            {index < noOfTagsToShow && (
              <Tooltip
                asChild
                trigger={
                  <div>
                    <Tag value={tag?.title} variant="primary" tagsLength={tags?.length} />{' '}
                  </div>
                }
                content={tag?.title}
              />
            )}
          </Fragment>
        ))}
        {tags?.length > noOfTagsToShow && (
          <Tooltip
            asChild
            trigger={
              <div>
                <Tag variant="primary" value={'+' + (tags?.length - noOfTagsToShow).toString()}></Tag>{' '}
              </div>
            }
            content={
              <div>
                {tags?.slice(noOfTagsToShow, tags?.length).map((tag: ITag, index: number) => (
                  <div key={`${tag} + ${tag} + ${index}`}>
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
        .team-grid__details-container__tagscontainer {
          display: flex;
          gap: 8px;
          height: 26px;
        }

        @media (min-width: 1024px) {
          .team-grid__details-container__tagscontainer {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
};

export default TeamsTagsList;
