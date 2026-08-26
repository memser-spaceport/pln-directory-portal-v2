import React, { useRef } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { AddButton } from '@/components/page/member-details/components/AddButton';
import { FormattedMemberExperience, useMemberExperience } from '@/services/members/hooks/useMemberExperience';
import { IMember } from '@/types/members.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IUserInfo } from '@/types/shared.types';
import { ViewType } from '@/types/ui';

import { ExperiencesList } from './components/ExperiencesList';
import { canEditMemberProfile } from '../../../utils/canEditMemberProfile';
import type { CvImportControls } from '../ExperienceImport';

import s from './ExperienceDetailsView.module.scss';

interface Props {
  member: IMember;
  userInfo: IUserInfo;
  setView: (view: ViewType) => void;
  setSelectedItem: (item: FormattedMemberExperience | null) => void;
  /** Absent when the CV importer is off — see `CvImportControls`. */
  cvImport?: CvImportControls;
}

export function ExperienceDetailsView(props: Props) {
  const { member, userInfo, setView, setSelectedItem, cvImport } = props;

  const isEditable = canEditMemberProfile(userInfo, member);

  const { data, isLoading } = useMemberExperience(member.id);
  const { onAddExperienceDetailsClicked, onEditExperienceDetailsClicked, onCvImportOpened } = useMemberAnalytics();

  const headerFileInput = useRef<HTMLInputElement>(null);

  /**
   * The refresh route, and only once there is something to refresh.
   *
   * While the section is empty the offer lives in the empty row, where it sits
   * under the sentence explaining what the section is for. Once entries exist
   * that row is gone and so is the offer — so without this the only way back to
   * the importer would be through the Add form, a six-field form nobody opens
   * when what they want is to drop a newer CV.
   *
   * "Update from CV", not "Upload your CV". The empty state's pill is a first
   * move; this is a refresh of something that already exists, and the verb is
   * the difference.
   */
  const showHeaderImport = Boolean(cvImport) && isEditable && !!data?.length;

  return (
    <>
      <DetailsSectionHeader title={`Experience ${data?.length ? `(${data.length})` : ''}`}>
        {isEditable && (
          <div className={s.headerActions}>
            {showHeaderImport && (
              <>
                {/* Straight to the file dialog. Pressing a control that says
                    "Update from CV" and landing on a card that asks you to
                    choose a file is the press not being taken at its word — and
                    the card behind it still appears, so a cancelled dialog
                    leaves you on the drop area rather than nowhere. */}
                <HeaderActionBtn
                  className={s.quietHeaderAction}
                  onClick={() => {
                    /* On the press, not on the file landing: the OS picker is
                       outside the page and a dialog someone opens and closes is
                       still an intent this funnel wants to count. */
                    onCvImportOpened('header-button');
                    headerFileInput.current?.click();
                  }}
                >
                  Update from CV
                </HeaderActionBtn>
                <input
                  ref={headerFileInput}
                  type="file"
                  className={s.visuallyHidden}
                  /* PDF only — the upload endpoint checks the magic bytes. */
                  accept=".pdf"
                  onChange={(ev) => {
                    const chosen = ev.target.files?.[0] ?? null;
                    /* Cleared so picking the same file twice still fires a
                       change event — "try again with the same document" is a
                       real path once a parse has failed. */
                    ev.target.value = '';
                    if (chosen) cvImport?.onPickFile(chosen);
                  }}
                />
              </>
            )}
            <AddButton
              onClick={() => {
                onAddExperienceDetailsClicked();
                setView('add');
              }}
            />
          </div>
        )}
      </DetailsSectionHeader>
      <ExperiencesList
        data={data}
        member={member}
        userInfo={userInfo}
        isEditable={isEditable}
        isLoading={isLoading}
        cvImport={cvImport}
        onEdit={(item) => {
          onEditExperienceDetailsClicked();
          setSelectedItem(item);
          setView('edit');
        }}
      />
    </>
  );
}
