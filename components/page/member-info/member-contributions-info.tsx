'use client';
import { useEffect, useState } from 'react';
import AddContribution from './contributions/add-contribution';
import ContributionHead from './contributions/contribution-head';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import TextField from '@/components/form/text-field';
import MonthYearField from '@/components/form/month-year-field';
import TextArea from '@/components/form/text-area';
import HiddenField from '@/components/form/hidden-field';
import TextAreaEditor from '@/components/form/text-area-editor';

function MemberContributionInfo(props: any) {
  const initialValues = props.initialValues;
  const projectsOptions = props.projectOptions ?? [];
  const [contributionInfos, setContributionInfos] = useState(initialValues.contributions);
  const errors = props.errors ?? {};
  const currentProjectsCount = contributionInfos.filter((v: any) => v.currentProject === true).length;
  const [expandedId, setExpandedId] = useState(-1);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentYear - 50;
  const startDate = new Date(startYear, currentMonth);
  const endDate = new Date();

  const defaultValues = {
    projectUid: '',
    projectName: '',
    projectLogo: '',
    currentProject: false,
    description: '',
    role: '',
    startDate: '1990-01-01',
    endDate: `${new Date().getFullYear()}-12-31`,
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

  const getAvailableContributionOptions = () => {
    const selectedTeamUids = [...contributionInfos].filter((v) => v.projectUid !== '').map((v) => v.projectUid);
    const remainingItems = [...projectsOptions].filter((v) => !selectedTeamUids.includes(v.projectUid));
    return [...remainingItems];
  };

  /* const onAddContribution = () => {
    setContributionInfos((v) => {
      const nv = structuredClone(v);
      nv.push({...defaultValues});
      return nv;
    });
  };

  

  const onDeleteContribution = (index: number) => {
    if (index === expandedId) {
      setExpandedId(-1);
    }
    setContributionInfos((old) => {
      const newItem = [...old];
      newItem.splice(index, 1);
      return newItem;
    });
  }; */

  const onClearProjectSearch = (index: number) => {
    setContributionInfos((old:any) => {
      old[index] = { ...old[index], projectUid: '', projectName: '', projectLogo: '', currentProject: false };
      return [...old];
    });
  };

  const onProjectSelectionChanged = (index: number, item: any) => {
    setContributionInfos((old:any) => {
      const newV = structuredClone(old);
      newV[index].projectUid = item.projectUid;
      newV[index].projectName = item.projectName;
      newV[index].projectLogo = item.projectLogo;
      return [...newV];
    });
  };

  const onProjectDetailsChanged = (index: number, value: string | boolean, key: string) => {
    setContributionInfos((old:any) => {
      const newV = structuredClone(old);
      newV[index][key] = value;
      return [...newV];
    });
  };

  useEffect(() => {
    function resetHandler() {
      setContributionInfos(initialValues.contributions);
    }
    document.addEventListener('reset-member-register-form', resetHandler);
    return function () {
      document.removeEventListener('reset-member-register-form', resetHandler);
    };
  }, [initialValues]);

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
            {Object.keys(errors).length > 0 && <p className="error">There are fields that require your attention. Please review the fields below.</p>}
            <AddContribution disableAdd={contributionInfos.length >= 20} onAddContribution={onAddContribution} />
            {contributionInfos.map((contributionInfo: any, index: number) => (
              <div className="pc__list__item" key={`member-skills-team-info-${index}`}>
                <ContributionHead
                  expandedId={expandedId}
                  contribution={contributionInfo}
                  contributionIndex={index}
                  currentProjectsCount={currentProjectsCount}
                  onDeleteContribution={onDeleteContribution}
                  onToggleExpansion={onToggleExpansion}
                  isError={errors[index] ? true : false}
                  onProjectStatusChanged={(value: boolean) => onProjectDetailsChanged(index, value, 'currentProject')}
                />

                <div className={`pc__list__item__form ${expandedId !== index ? 'hidden' : ''}`}>
                  {errors[index] && (
                    <ul className="error">
                      {errors[index].map((error: string, index:number) => (
                        <li key={`contibution-error-${index}`}>{error}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pc__list__item__form__item">
                    <SearchableSingleSelect
                      placeholder="Search projects by name"
                      label="Project Name*"
                      uniqueKey="projectUid"
                      formKey="projectUid"
                      isMandatory={true}
                      isFormElement={true}
                      name={`contributionInfo${index}-projectUid`}
                      onClear={() => onClearProjectSearch(index)}
                      options={getAvailableContributionOptions()}
                      selectedOption={contributionInfo}
                      displayKey="projectName"
                      id={`member-contribution-project-${index}`}
                      onChange={(item) => onProjectSelectionChanged(index, item)}
                    />
                  </div>
                  <div className="pc__list__item__form__item">
                    <TextField
                      defaultValue={contributionInfo.role}
                      onChange={(e) => onProjectDetailsChanged(index, e.target.value, 'role')}
                      placeholder="Ex: Senior Architect"
                      type="text"
                      isMandatory={true}
                      label="Role*"
                      id={`member-contribution-role-${index}`}
                      name={`contributionInfo${index}-role`}
                    />
                  </div>
                  <div className="pc__list__item__form__item">
                    <MonthYearField
                      id={`member-contribution-startDate-${index}`}
                      onChange={(e) => onProjectDetailsChanged(index, e, 'startDate')}
                      name={`contributionInfo${index}-startDate`}
                      defaultValue={startDate.toISOString()}
                      dateBoundary='start'
                      label="From*"
                    />
                    <MonthYearField
                      disabled={contributionInfo.currentProject}
                      id={`member-contribution-endDate-${index}`}
                      onChange={(e) => onProjectDetailsChanged(index, e, 'endDate')}
                      name={`contributionInfo${index}-endDate`}
                      defaultValue={endDate.toISOString()}
                      dateBoundary='end'
                      label="To*"
                    />
                  </div>
                  <div className="pc__list__item__form__item">
                    <div className="editor">
                      <TextAreaEditor name={`contributionInfo${index}-description`} label="Description" placeholder="Enter Project Contribution.." />
                    </div>
                  </div>
                </div>
              </div>
            ))}
             {expandedId !== -1 && <AddContribution disableAdd={contributionInfos.length >= 20} onAddContribution={onAddContribution} />}
          </div>
        )}
      </div>

      <style jsx>
        {`
          .editor {
            width: 100%;
           
          }
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
            width: 100%;
            margin: 20px;
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
            height: auto;
          }
          .hidden {
            visibility: hidden;
            height: 0;
            margin: 0;
            max-height:0;
            overflow: hidden;
          }
          .pc__list__item__form__item {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .error {
            color: #ef4444;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 16px;
          }
          @media (min-width: 1024px) {
            .pc__list {
              padding-top: 32px;
            }
            .pc__list__item__form__item {
              flex-direction: row;
              gap: 8px;
            }
          }
        `}
      </style>
    </>
  );
}

export default MemberContributionInfo;
