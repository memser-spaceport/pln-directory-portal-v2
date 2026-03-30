import { ReactNode } from 'react';
import isEmpty from 'lodash/isEmpty';

import { ITag } from '@/types/teams.types';

import {
  NoDataBlock,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';
import { EditButton } from '@/components/common/profile/EditButton';

import s from './TeamsTagsListSectionView.module.scss';

export interface TeamsTagsListSectionViewProps {
  tags?: ITag[];
  title: ReactNode;
  canEdit: boolean;
  emptyMessage: ReactNode;
  toggleIsEditMode: () => void;
}

export function TeamsTagsListSectionView(props: TeamsTagsListSectionViewProps) {
  const { tags = [], title, canEdit, emptyMessage, toggleIsEditMode } = props;

  const noTags = isEmpty(tags);

  return (
    <>
      <DetailsSectionHeader title={title}>{canEdit && <EditButton onClick={toggleIsEditMode} />}</DetailsSectionHeader>
      <DetailsSectionGreyContentContainer>
        {noTags ? (
          <NoDataBlock>{emptyMessage}</NoDataBlock>
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
