import Toggle from "@/components/form/toggle";

interface ContributionHeadProps {
    expandedId: number,
    contributionIndex: number,
    onDeleteContribution: (index: number) => void,
    currentProjectsCount: number,
    contribution: any,
    onToggleExpansion: (index: number) => void
}

function ContributionHead(props: ContributionHeadProps) {
  const expandedId = props.expandedId;
  const contributionIndex = props.contributionIndex;
  const onDeleteContribution = props.onDeleteContribution;
  const currentProjectsCount = props.currentProjectsCount;
  const contribution = props.contribution;
  const onToggleExpansion = props.onToggleExpansion;
  return (
    <>
      <div className="cb">
        <div className="cb__actions">
          {contributionIndex === expandedId && <img className="cursor-pointer" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-down-blue.svg" />}
          {contributionIndex !== expandedId && <img className="cursor-pointer" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-up-blue.svg" />}
          <img onClick={() => onDeleteContribution(contributionIndex)} className="cursor-pointer" src="/icons/delete-icon.svg" />
        </div>
        {contribution?.projectName.trim() === '' && <h2 className="cb__name">{`Project ${contributionIndex + 1}`}</h2>}
        {contribution?.projectName.trim() !== '' && <h2 className="cb__name">{`${contribution?.projectName.trim()}`}</h2>}
        <div className="cb__projects">
          <div title={`${contribution.currentProject === false && currentProjectsCount === 5 ? 'Max 5 projects can be set as current' : 'On/Off'} `}>
          <Toggle id={`member-register-contribution-currentproject-${contributionIndex}`}/>
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
      <style>
        {`
             .cb {
          border-radius: 4px;
          background: #f1f5f9;
          height: 32px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
        }

        .cb__actions {
          display: flex;
          gap: 10px;
        }

        .cb__projects {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          gap: 8px;
        }

        .cb__name {
          color: #0f172a;
          flex: 1;
          font-weight: 600;
          font-size: 14px;
          padding-left: 16px;
        }

            
            `}
      </style>
    </>
  );
}

export default ContributionHead;
