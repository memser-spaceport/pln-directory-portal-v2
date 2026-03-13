import { ReactNode } from 'react';
import isEmpty from 'lodash/isEmpty';

import { ITag } from '@/types/teams.types';

import { TagsList } from '@/components/common/profile/TagsList';
import { EditButton } from '@/components/common/profile/EditButton';
import { DetailsSectionHeader, DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';

import s from './TeamsTagsListSectionView.module.scss';

export interface TeamsTagsListSectionViewProps {
  tags?: ITag[];
  title: ReactNode;
  emptyMessage: ReactNode;
  toggleIsEditMode: () => void;
}

export function TeamsTagsListSectionView(props: TeamsTagsListSectionViewProps) {
  const { tags = [], title, emptyMessage, toggleIsEditMode } = props;

  const noTags = isEmpty(tags);

  return (
    <>
      <DetailsSectionHeader title={title}>
        <EditButton onClick={toggleIsEditMode} />
      </DetailsSectionHeader>
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
    </>
  );
}
