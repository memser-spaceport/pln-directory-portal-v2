'use client';
import { useState } from 'react';
import ContributionForm from './contributions/contribution-form';
import AddContribution from './contributions/add-contribution';
import ContributionHead from './contributions/contribution-head';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextField from '@/components/form/text-field';
import MonthYearField from '@/components/form/month-year-field';
import TextArea from '@/components/form/text-area';

function MemberContributionInfo(props: any) {
  const projects = props.projectOptions ?? [];
  console.log(projects);
  const [contributionInfos, setContributionInfos] = useState(props.projectContributions ?? []);
  const showAddProject = props.showAddProject ?? false;
  const errors = props.contributionErrors ?? [];
  const currentProjectsCount = contributionInfos.filter((v: any) => v.currentProject === true).length;
  const onChange = props.onChange;
  const initialValues = props?.initialValues?.projectContributions ?? [];
  const intialProjectContributions = [...initialValues];

  const [expandedId, setExpandedId] = useState(-1);

  const defaultValues = {
    projectUid: '',
    projectName: '',
    projectLogo: '',
    currentProject: false,
    description: '',
    role: '',
    startDate: new Date(1990, 0),
    endDate: new Date(),
  };

  const onToggleExpansion = (index: number) => {
    setExpandedId((v) => {
      if (v === index) {
        return -1;
      } else {
        return index;
      }
    });
  };

  const onAddContribution = () => {
    const newExp = [...contributionInfos];
    newExp.push(defaultValues);
    setExpandedId(newExp.length - 1);
    setContributionInfos([...newExp]);
  };

  const onDeleteContribution = (index: number) => {
    if (index === expandedId) {
      setExpandedId(-1);
    }
    const newExp = [...contributionInfos];
    newExp.splice(index, 1);
    setContributionInfos([...newExp]);
  };

  const onClearProjectSearch = (index: number) => {
    setContributionInfos((old) => {
      old[index] = { projectUid: '', projectName: '', projectLogo: '', currentProject: false };
      return [...old];
    });
  };

  const onProjectSelectionChanged = (index: number, item: any) => {
    setContributionInfos((old) => {
      const newV = structuredClone(old);
      newV[index].projectUid = item.projectUid;
      newV[index].projectName = item.projectName;
      newV[index].projectLogo = item.projectLogo;
      newV[index].currentProject = false;
      return [...newV];
    });
  };

  return (
    <>
      <div className="pc">
        {contributionInfos.length === 0 && (
          <div onClick={onAddContribution} className="pc__new">
            <img alt="add contribution" src="/icons/add-contribution.svg" width="36" height="36" />
            <p className="pc__new__text">Click to add project contributions</p>
          </div>
        )}

        {contributionInfos.length > 0 && (
          <div className="pc__list">
            <AddContribution onAddContribution={onAddContribution} />
            {contributionInfos.map((contributionInfo: any, index: number) => (
              <div className="pc__list__item" key={`member-skills-team-info-${index}`}>
                <ContributionHead
                  expandedId={expandedId}
                  contribution={contributionInfo}
                  contributionIndex={index}
                  currentProjectsCount={currentProjectsCount}
                  onDeleteContribution={onDeleteContribution}
                  onToggleExpansion={onToggleExpansion}
                />
                {expandedId === index && (
                  <div className="pc__list__item__form">
                    <div className="pc__list__item__form__item">
                      <SearchableSingleSelect
                        placeholder="Search projects by name"
                        label="Project Name*"
                        uniqueKey="projectUid"
                        isMandatory={true}
                        name={`contributionInfo${index}-projectName`}
                        onClear={() => onClearProjectSearch(index)}
                        options={projects}
                        selectedOption={contributionInfo}
                        displayKey="projectName"
                        id={`member-contribution-project-${index}`}
                        onChange={(item) => onProjectSelectionChanged(index, item)}
                      />
                    </div>
                    <div className="pc__list__item__form__item">
                      <TextField placeholder="Ex: Senior Architect" type="text" isMandatory={true} label="Role*" id={`member-contribution-role-${index}`} name={`contributionInfo${index}-role`} />
                    </div>
                    <div className="pc__list__item__form__item">
                      <MonthYearField name={`contributionInfo${index}-startDate`} defaultValue="min" label="From*" />
                      <MonthYearField name={`contributionInfo${index}-endDate`} defaultValue="max" label="To*" />
                    </div>
                    <div className="pc__list__item__form__item">
                      <TextArea label="Description" placeholder="Enter Project Contribution.." id={`member-contribution-description-${index}`} name={`contributionInfo${index}-description`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>
        {`
          .pc {
            height: 100%;
            width: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
          }

          .pc__new {
            border: 1px dotted #156ff7;
            display: flex;
            padding: 20px;
            gap: 10px;
            background: #f1f5f9;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .pc__new__text {
            color: #156ff7;
            font-size: 13px;
            font-weight: 500;
          }

          .pc__list {
            width: 100%;
          }

          .pc__list__item {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .pc__list__item__form {
            margin: 16px 0;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .pc__list__item__form__item {
            width: 100%;
            display: flex;
            gap: 8px;
          }
          @media (min-width: 1200px) {
            .pc__list {
              padding-top: 32px;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberContributionInfo;
