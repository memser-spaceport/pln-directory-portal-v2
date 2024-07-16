import CustomToggle from '@/components/form/custom-toggle';
import Toggle from '@/components/form/toggle';

interface ContributionHeadProps {
  expandedId: number;
  contributionIndex: number;
  onDeleteContribution: (index: number) => void;
  currentProjectsCount: number;
  contribution: any;
  isError: boolean;
  onToggleExpansion: (index: number) => void;
  onProjectStatusChanged: (checked: boolean) => void;
}

function ContributionHead(props: ContributionHeadProps) {
  const expandedId = props.expandedId;
  const contributionIndex = props.contributionIndex;
  const onDeleteContribution = props.onDeleteContribution;
  [];
  const currentProjectsCount = props.currentProjectsCount;
  const contribution = props.contribution;
  const onToggleExpansion = props.onToggleExpansion;
  const isError = props.isError ?? false;
  const onProjectStatusChanged = props.onProjectStatusChanged;
  return (
    <>
      <div className={`cb ${isError ? 'cb--error' : ''}`}>
        <div className="cb__actions">
          {contributionIndex === expandedId && <img className="img-icon" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-down-blue.svg" />}
          {contributionIndex !== expandedId && <img className="img-icon" onClick={() => onToggleExpansion(contributionIndex)} src="/icons/arrow-up-blue.svg" />}
          <img onClick={() => onDeleteContribution(contributionIndex)} className="img-icon" src="/icons/delete-icon.svg" />
        </div>
        {contribution?.projectName.trim() === '' && <h2 className="cb__name">{`Project ${contributionIndex + 1}`}</h2>}
        {contribution?.projectName.trim() !== '' && <h2 className="cb__name">{`${contribution?.projectName.trim()}`}</h2>}
        <div className="cb__projects">
          <div title={`${contribution.currentProject === false && currentProjectsCount === 5 ? 'Max 5 projects can be set as current' : 'On/Off'} `}>
            {/* <Toggle onChange={onProjectStatusChanged} disabled={contribution.currentProject === false && currentProjectsCount === 5} checked={contribution.currentProject} name={`contributionInfo${contributionIndex}-currentProject`} id={`member-register-contribution-currentproject-${contributionIndex}`}/> */}
            <CustomToggle
              name={`contributionInfo${contributionIndex}-currentProject`}
              id={`member-register-contribution-currentproject-${contributionIndex}`}
              defaultChecked={contribution.currentProject}
              disabled={contribution.currentProject === false && currentProjectsCount === 5}
              onChange={(e) => onProjectStatusChanged(e.target.checked)}
            />
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
          margin: 4px 0;
        }
          .img-icon {
            cursor: pointer;
          }
        .cb--error {
          border: 1px solid #ed6e68;
          background: #ef44441a;
         

        }

        .cb__actions {
          display: flex;
          gap: 10px;
        }

        .cb__projects {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          gap: 8px;
        }

        .cb__name {
          color: #0f172a;
          flex: 1;
          font-weight: 600;
          font-size: 11px;
          padding-left: 16px;
          -webkit-box-orient: vertical;
          display: -webkit-box;
           -webkit-line-clamp: 2;
           text-overflow: ellipsis;
           overflow: hidden;
           padding-right: 8px;
        }
          @media(min-width: 1024px) {
            .cb__name {
            font-size: 14px;
            }

            .cb__projects {
            font-size: 12px;
            }
          }

            
            `}
      </style>
    </>
  );
}

export default ContributionHead;
