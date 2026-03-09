import isEmpty from 'lodash/isEmpty';

import { ITag } from '@/types/teams.types';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';

import s from './TeamsTagsListSection.module.scss';

interface Props {
  tags?: ITag[];
  title: string;
  emptyMessage: string;
}

export function TeamsTagsListSection(props: Props) {
  const { tags = [], title, emptyMessage } = props;

  const noTags = isEmpty(tags);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={title} />
      <DetailsSectionGreyContentContainer>
        {noTags ? (
          <span className={s.emptyMessage}>{emptyMessage}</span>
        ) : (
          <TagsList
            tags={tags}
            tagsToShow={5}
            classes={{
              tag: s.tag,
            }}
          />
        )}
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
