import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { Fragment } from 'react';

const MemberSkillList = (props: any) => {
  const skills = props?.skills ?? [];
  const isListView = props?.isListView;
  const noOfSkillsToShow = props?.noOfSkillsToShow;

  return (
    <>
      <div className="member-grid__profile-container__ftr__tags-container">
        {skills?.map((skill: any, index: number) => (
          <Fragment key={`${skill} + ${index}`}>
            {index < noOfSkillsToShow && (
              <Tooltip
                asChild
                trigger={
                  <div>
                    <Tag value={skill?.title} variant={isListView ? "": "primary"} tagsLength={skills?.length} />
                  </div>
                }
                content={skill?.title}
              />
            )}
          </Fragment>
        ))}
        {skills?.length > noOfSkillsToShow && (
          <Tooltip
            asChild
            trigger={
              <div>
                <Tag variant="primary" value={'+' + (skills?.length - noOfSkillsToShow).toString()}></Tag>
              </div>
            }
            content={
              <div>
                {skills?.slice(noOfSkillsToShow, skills?.length).map((skill: any, index: number) => (
                  <div key={`${skill} + ${skill} + ${index}`}>
                    {skill?.title}{index !== skills?.slice(noOfSkillsToShow, skills?.length - 1)?.length ? ',' : ''}
                  </div>
                ))}
              </div>
            }
          />
        )}
      </div>
      <style jsx>{`
        .member-grid__profile-container__ftr__tags-container {
          display: flex;
          gap: 8px;
          height: 26px;
        }
      `}</style>
    </>
  );
};

export default MemberSkillList;
