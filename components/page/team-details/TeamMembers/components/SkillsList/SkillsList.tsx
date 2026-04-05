import { ITag } from '@/types/teams.types';

import { Tag } from '@/components/ui/Tag';
import { Tooltip } from '@/components/core/tooltip/tooltip';

interface Props {
  skills: ITag[];
  maxVisible?: number;
}

const DEFAULT_MAX_VISIBLE = 3;

export function SkillsList(props: Props) {
  const { skills, maxVisible = DEFAULT_MAX_VISIBLE } = props;

  const skillsNum = skills.length;

  if (!skillsNum) {
    return null;
  }

  return (
    <>
      {skills.slice(0, maxVisible).map((skill: ITag, i: number) => (
        <Tooltip
          key={skill.uid ?? i}
          asChild
          trigger={
            <div>
              <Tag value={skill.title} />
            </div>
          }
          content={skill.title}
        />
      ))}
      {skillsNum > maxVisible && (
        <Tooltip
          asChild
          trigger={
            <div>
              <Tag value={`+${skillsNum - maxVisible}`} />
            </div>
          }
          content={
            <div>
              {skills.slice(maxVisible).map((skill, i) => (
                <div key={i}>{skill.title}</div>
              ))}
            </div>
          }
        />
      )}
    </>
  );
}
