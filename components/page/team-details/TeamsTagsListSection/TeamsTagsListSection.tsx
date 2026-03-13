'use client';

import { useToggle } from 'react-use';

import { ITeam } from '@/types/teams.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { TeamsTagsListSectionView, TeamsTagsListSectionViewProps } from './components/TeamsTagsListSectionView';
import { TeamsTagsListSectionEdit, TeamsTagsListSectionEditProps } from './components/TeamsTagsListSectionEdit';

interface Props {
  team: ITeam;
  view: Omit<TeamsTagsListSectionViewProps, 'toggleIsEditMode'>;
  edit: Omit<TeamsTagsListSectionEditProps, 'team' | 'toggleIsEditMode'>;
}

export function TeamsTagsListSection(props: Props) {
  const { team, view, edit } = props;

  const [isEditMode, toggleIsEditMode] = useToggle(false);

  return (
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamsTagsListSectionEdit
          {...edit}
          team={team}
          toggleIsEditMode={toggleIsEditMode}
        />
      ) : (
        <TeamsTagsListSectionView {...view} toggleIsEditMode={toggleIsEditMode} />
      )}
    </DetailsSection>
  );
}
