import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { TROUBLES_INFO } from '@/utils/constants';

const TroubleSection = (props: any) => {
  const onTroubleOptionClickHandler = props.onTroubleOptionClickHandler;
  const troubles = props?.troubles ?? [];

  return (
    <>
      <div className="trblesec">
        {/* Title */}
        <div className="trblesec__titlctr">
          <img alt="info" src="/icons/info-outline.svg" />
          <span className="trblesec__titlctr__ttl">Had trouble with the meeting?</span>
        </div>

        {/* Didn't happen */}
        <div className="trblesec__didnthpn">
          <div className="trblesec__didnthpn__optn">
            <div className="trblesec__didnthpn__optn__chckbox">
              {troubles?.includes(TROUBLES_INFO.didntHappened.name) && (
                <button onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.didntHappened.name)} className="trblesec__didnthpn__optn__chckbox__sltdbtn">
                  <img height={16} width={16} src="/icons/right-white.svg" />
                </button>
              )}

              {!troubles?.includes(TROUBLES_INFO.didntHappened.name) && (
                <button onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.didntHappened.name)} className="trblesec__didnthpn__optn__chckbox__notsltdbtn"></button>
              )}
            </div>
            <div className="trblesec__didnthpn__optn__cnt">Meeting didn’t happen</div>
          </div>

          {troubles?.includes(TROUBLES_INFO.didntHappened.name) && <div>
            
            <SearchableSingleSelect
                  id="project-register-contributor-info"
                  placeholder="All Team"
                  displayKey="name"
                  options={[{name: "other"}]}
                  selectedOption={""}
                  uniqueKey="teamUid"
                  formKey="teamTitle"
                  name={`projectInfo-teamTitle`}
                  onClear={() => () => {}}
                  onChange={(item) => () => {}}
                  arrowImgUrl="/icons/arrow-down.svg"
                  iconKey="logo"
                  defaultImage="/icons/team-default-profile.svg"
                />
            
            </div>}
        </div>

        {/* Technial issue */}

        <div className="trblesec__techisue">
          <div className="trblesec__didnthpn__optn">
            <div className="trblesec__didnthpn__optn__chckbox">
              {troubles?.includes(TROUBLES_INFO.technicalIssues.name) && (
                <button onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.technicalIssues.name)} className="trblesec__didnthpn__optn__chckbox__sltdbtn">
                  <img height={16} width={16} src="/icons/right-white.svg" />
                </button>
              )}

              {!troubles?.includes(TROUBLES_INFO.technicalIssues.name) && (
                <button onClick={() => onTroubleOptionClickHandler(TROUBLES_INFO.technicalIssues.name)} className="trblesec__didnthpn__optn__chckbox__notsltdbtn"></button>
              )}
            </div>
            <div className="trblesec__didnthpn__optn__cnt">Faced technical issues</div>
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .trblesec {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 14px;
            background-color: #f1f5f9;
            border-radius: 8px;
          }

          .trblesec__titlctr {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .trblesec__titlctr__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .trblesec__didnthpn {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .trblesec__didnthpn__optn {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .trblesec__didnthpn__optn__cnt {
            font-size: 14px;
            font-weight: 400;
            display: flex;
            align-items: center;
            line-height: 20px;
          }

          .trblesec__didnthpn__optn__chckbox {
            height: 20px;
          }

          .trblesec__didnthpn__optn__chckbox__sltdbtn {
            background-color: #156ff7;
            border-radius: 4px;
            display: flex;
            align-items: center;
            height: 20px;
            width: 20px;
            justify-content: center;
          }

          .trblesec__didnthpn__optn__chckbox__notsltdbtn {
            border: 1px solid #cbd5e1;
            height: 20px;
            width: 20px;
            border-radius: 4px;
          }

          .trblesec__techisue {
            display: flex;
            gap: 8px;
            align-items: center;
          }
        `}
      </style>
    </>
  );
};

export default TroubleSection;
