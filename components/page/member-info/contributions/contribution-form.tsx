import { useEffect, useRef } from 'react';
import ProjectSelection from './project-selection';
import TextField from '@/components/form/text-field';
import MonthYearField from '@/components/form/month-year-field';
import TextArea from '@/components/form/text-area';

function ContributionForm(props) {
  const showAddProject = props.showAddProject;
  const currentProjectsCount = props.currentProjectsCount;
  const onItemChange = props.onItemChange;
  const exp = props.exp;
  const contributionIndex = props.contributionIndex;
  const errors = props?.errors.filter((err) => err?.id === contributionIndex);
  const onDeleteContribution = props.onDeleteContribution;
  const expandedId = props.expandedId;
  const onToggleExpansion = props.onToggleExpansion;
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const contributions = props.contributions ?? [];

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 50;
    const years = [];
    for (let year = start; year <= currentYear; year++) {
      years.push({ label: `${year}`, value: `${year}` });
    }
    return years;
  };

  const yearValues = getYears();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const startMonthIndex = monthNames.indexOf(new Date(exp.startDate).toLocaleDateString(undefined, { month: 'long' }));
  const endMonthIndex = monthNames.indexOf(new Date(exp.endDate).toLocaleDateString(undefined, { month: 'long' }));
  const selectedStartYear = { label: `${new Date(exp.startDate).getFullYear()}`, value: `${new Date(exp.startDate).getFullYear()}` };
  const selectedEndyear = { label: `${new Date(exp.endDate).getFullYear()}`, value: `${new Date(exp.endDate).getFullYear()}` };

  const getMonths = () => {
    return [...monthNames].map((m) => {
      return { label: m, value: m };
    });
  };

  const onMonthChange = (field, value) => {
    const monthIndex = monthNames.indexOf(value);
    const year = new Date(exp[field])?.getFullYear();
    const newDate = new Date(year, monthIndex);
    onItemChange(contributionIndex, field, newDate);
  };

  const onYearChange = (field, value) => {
    const month = new Date(exp[field])?.getMonth();
    const newDate = new Date(parseInt(value, 10), month);
    onItemChange(contributionIndex, field, newDate);
  };

  const onProjectSelected = (item) => {
    if (item && item.name) {
      onItemChange(contributionIndex, 'projectName', item.name);
      onItemChange(contributionIndex, 'projectUid', item?.uid);
      onItemChange(contributionIndex, 'projectLogo', item?.logo?.url);
      onItemChange(contributionIndex, 'project', item);
    } else {
      onItemChange(contributionIndex, 'projectName', '');
      onItemChange(contributionIndex, 'projectLogo', '');
      onItemChange(contributionIndex, 'projectUid', '');
      onItemChange(contributionIndex, 'project', null);
    }
  };

  const onDescChanged = (newValue) => {
    onItemChange(contributionIndex, 'description', newValue);
  };

  const onAddNewProject = () => {};

  return (
    <>
      <div key={`${contributionIndex}-exp`} className="cb">
        {/* HEAD */}
        <div className="cb__head">
          <div className="cb__head__actions">
            {contributionIndex === expandedId && <img className="cursor-pointer" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-down-blue.svg" />}
            {contributionIndex !== expandedId && <img className="cursor-pointer" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-up-blue.svg" />}
            <img onClick={() => onDeleteContribution(contributionIndex)} className="cursor-pointer" src="/icons/delete-icon.svg" />
          </div>
          {exp?.projectName.trim() === '' && <h2 className="cb__head__name">{`Project ${contributionIndex + 1}`}</h2>}
          {exp?.projectName.trim() !== '' && <h2 className="cb__head__name">{`${exp?.projectName.trim()}`}</h2>}
          <div className="cb__head__projects">
            <div title={`${exp.currentProject === false && currentProjectsCount === 5 ? 'Max 5 projects can be set as current' : 'On/Off'} `}>
              {/* <Switch
                  nonEditable={exp.currentProject === false && currentProjectsCount === 5}
                  initialValue={exp.currentProject}
                  onChange={(val) => onItemChange(contributionIndex, 'currentProject', val)}
                  key={`${contributionIndex}-switch`}
                /> */}
            </div>
            <label className="">Current Project</label>
          </div>
        </div>

        {contributionIndex === expandedId && (
          <div className="cb__content">
            {/* ERRORS */}
            <ul className="cb__content__errors">
              {errors.map((err, errIndex) => (
                <li className="text-[#EF4444] text-[12px]" key={`err-${errIndex}`}>
                  {err.error}
                </li>
              ))}
            </ul>

            {/*   LOGO & PROJECT NAME   */}
            <div className="cb__content__fieldgroup">
              <TextField
                type="text"
                isMandatory={true}
                placeholder="Search projects by name"
                label="Project Name*"
                id="member-contribution-projectname"
                name={`contribution${contributionIndex}-projectName`}
              />
            </div>

            {/*  ROLE  */}
            <div className="cb__content__fieldgroup">
              <TextField label="Role*" isMandatory={true} type="text" placeholder="Ex: Senior Architect" name={`contribution${contributionIndex}-role`} id="member-contribution-role" />
            </div>

            {/*   DATES  */}
            <div className="cb__content__fieldgroup">
              <MonthYearField defaultValue='min' label="From*" />
              <MonthYearField defaultValue='max' label="To*" />
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
        .cb__head {
          border-radius: 4px;
          background: #f1f5f9;
          height: 32px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
        }

        .cb__head__actions {
          display: flex;
          gap: 10px;
        }

        .cb__head__projects {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          gap: 8px;
        }

        .cb__head__name {
          color: #0f172a;
          flex: 1;
          font-weight: 600;
          font-size: 14px;
          padding-left: 16px;
        }

        .cb__content__fieldgroup {
          display: flex;
          gap: 10px;
          flex-direction: column;
          margin: 20px 0;
          width: 100%;

        }

        @media(min-width: 1200px) {
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
