import { useEffect, useRef, useState } from 'react';
import ProjectSelection from './project-selection';
import TextField from '@/components/form/text-field';
import MonthYearField from '@/components/form/month-year-field';
import TextArea from '@/components/form/text-area';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import ContributionHead from './contribution-head';

function ContributionForm(props) {


  const currentProjectsCount = props.currentProjectsCount;

  const exp = props.exp;
  const contributionIndex = props.contributionIndex;
  const errors = props?.errors.filter((err) => err?.id === contributionIndex);
  const onDeleteContribution = props.onDeleteContribution;
  const expandedId = props.expandedId;
  const onToggleExpansion = props.onToggleExpansion;
 

  return (
    <>
      <div key={`${contributionIndex}-exp`} className="cb">
        {/* HEAD */}
        

        {contributionIndex === expandedId && (
          <div className="cb__content">

            {/*   LOGO & PROJECT NAME   */}
            <div className="cb__content__fieldgroup">
              {/* <SearchableSingleSelect
               label="Project Name*"
               id="member-contribution-projectname"
             //  name={`contribution${contributionIndex}-projectName`}
                    isMandatory={true}
                    placeholder="Search projects by name"
                    displayKey="teamTitle"
                    options={getAvailableTeamOptions()}
                    selectedOption={contriinfo}
                    uniqueKey="teamUid"
                    onClear={() => onClearTeamSearch(contributionIndex)}
                    onChange={(item) => onTeamSelectionChanged(index, item)}
                    arrowImgUrl="/icons/arrow-down.svg"
                  /> */}
            </div>

            {/*  ROLE  */}
            <div className="cb__content__fieldgroup">
              <TextField label="Role*" isMandatory={true} type="text" placeholder="Ex: Senior Architect" name={`contribution${contributionIndex}-role`} id="member-contribution-role" />
            </div>

            {/*   DATES  */}
            <div className="cb__content__fieldgroup">
              <MonthYearField defaultValue="min" label="From*" />
              <MonthYearField defaultValue="max" label="To*" />
            </div>

            {/********************************   DESCRIPTION   ***********************************/}
            <div className="cb__content__fieldgroup">
              <TextArea label="Description" id="member-contribution-description" name={`contribution${contributionIndex}-description`} />
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .cb {
          margin-bottom: 8px;
        }

        .cb__content__fieldgroup {
          display: flex;
          gap: 10px;
          flex-direction: column;
          margin: 20px 0;
          width: 100%;
        }

        @media (min-width: 1200px) {
          .cb__content__fieldgroup {
            flex-direction: row;
            gap: 20px;
          }
        }
      `}</style>
    </>
  );
}

export default ContributionForm;
