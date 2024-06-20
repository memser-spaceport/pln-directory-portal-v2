import MultiSelect from '@/components/form/multi-select';

const TeamProjectsInfo = (props: any) => {
  return (
    <>
      <div>
        <MultiSelect
          options={skillsOptions}
          selectedOptions={selectedSkills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          uniqueKey="id"
          displayKey="name"
          label="Professional Skills*"
          placeholder="Search options..."
          isMandatory={false}
          closeImgUrl="/icons/close.svg"
          arrowImgUrl="/icons/arrow-down.svg"
        />
      </div>
      <style>{`
    `}</style>
    </>
  );
};

export default TeamProjectsInfo;
