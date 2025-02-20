'use client';
import React, { Fragment, useEffect, useState } from 'react';
import Search from '../irl/attendee-list/search';
import TeamMemberCard from '../team-form-info/team-member-card';
import Image from 'next/image';

const TeamsMemberInfo = (props: any) => {
  const [searchData, setSearchData] = useState<string>('');
  const teamMembers = props?.teamMembers;
  const handleTeamLeadToggle = props?.handleTeamLeadToggle;
  const handleRemoveMember = props?.handleRemoveMember;
  const membersDetail = props?.membersDetail;
  const setTeamMembers = props?.setTeamMembers;
  let searchedData = [];

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputValue = (e.target as HTMLInputElement).value;
      setSearchData(inputValue);
    }
  };

  useEffect(() => {
    if (searchData.length) {
      searchedData = membersDetail.filter((data: any) => data.name.toLowerCase().includes(searchData.toLowerCase()));
      if (searchedData) setTeamMembers(structuredClone(searchedData));
    } else {
      setTeamMembers(membersDetail);
    }
  }, [searchData]);

  return (
    <>
      <div className="ms__content__members__search">
        <Search placeholder="Search Members" onKeyDown={handleSearch} />
      </div>
      {teamMembers.length > 0 ? (
        teamMembers.map((member: any, index: number) => {
          return (
            <Fragment key={index}>
              <TeamMemberCard member={member} handleTeamLeadToggle={handleTeamLeadToggle} handleRemoveMember={handleRemoveMember} />
            </Fragment>
          );
        })
      ) : (
        <div className="ms__content__no__members">
          <Image src="/icons/search-img.svg" alt="no-members" width={200} height={178} />
          <p className="ms__content__no__members_text">No Members</p>
          <p className="ms__content__no__members_sec__text">There are no members in the list</p>
        </div>
      )}
      <style jsx>
        {`
          .ms__content__members__search {
            padding: 0px 24px;
            padding-top: 20px;
            height: 80px;
            border-bottom: 1px solid #cbd5e1;
          }
          .ms__content__no__members {
            padding: 0px 24px;
            height: 70vh;
            justify-content: center;
            display: flex;
            align-items: center;
            flex-direction: column;
            background-color: #f8fafc;
          }
          .ms__content__no__members_text {
            line-height: 40px;
            font-size: 24px;
            color: #0f172a;
            font-weight: 700;
          }
          .ms__content__no__members_sec__text {
            line-height: 20px;
            font-size: 14px;
            color: #000000;
            font-weight: 400;
          }
        `}
      </style>
    </>
  );
};

export default TeamsMemberInfo;
