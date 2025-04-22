const SearchMembers = (props: any) => {
  const { message, onMemberSelect } = props;

  const text = message?.toolInvocation?.result?.text;
  const members = message?.toolInvocation?.result?.members;

  console.log(members);

  return (
    <>
      <div className="search-members-container">
        <div className="intro-message-assistant-text-container">
          <img src="/images/husky/intro-assistant.svg" alt="assistant" className="intro-message-assistant-text-container__profile-image" />
          <div className="intro-message-assistant-text-container__text">{text}</div>
        </div>

        {members && members.length > 0 && (
          <div className="search-members-container__members">
            {members.map((member: any) => (
              <div className="search-members-container__member" key={member.id}>
                <div className="search-members-container__member__profile">
                  <img src={member.imageUrl ? member.imageUrl : '/icons/default_profile.svg'} alt="profile" className="search-members-container__member__profile-image" />
                  <div className="search-members-container__member__profile__namecontainer">
                    <div className="search-members-container__member__profile__namecontainer__name">{member.name}</div>
                    <div className="search-members-container__member__profile__namecontainer__team">{member?.team?.name ? member?.team?.name : '--'}</div>
                  </div>
                </div>
                    <button className="search-members-container__member__profile__connect-button" onClick={() => onMemberSelect(member)}>
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>
        {`
          .search-members-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .intro-message-assistant-text-container {
            display: flex;
            gap: 20px;
            align-items: start;
            padding: 17px 14px;
            background-color: white;
            border-radius: 8px;
          }

          .intro-message-assistant-text-container__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 22px;
          }

          .intro-message-assistant-text-container__profile-image {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }

          .search-members-container__members {
            display: flex;
            gap: 12px;
            flex-direction: column;
          }

          .search-members-container__member {
            padding: 8px 10px;
            border-radius: 12px;
            border: 1px solid #156ff7;
            background: #fff;
          }

          .search-members-container__member__profile {
            display: flex;
            gap: 8px;
          }
          .search-members-container__member__profile-image {
            height: 40px;
            width: 40px;
            border-radius: 50%;
            overflow: hidden;
          }

          .search-members-container__member__profile__namecontainer {
            display: flex;
            flex-direction: column;
          }

          .search-members-container__member__profile__namecontainer__name {
            font-weight: 600;
            font-size: 14px;
            line-height: 28px;
          }

          .search-members-container__member__profile__namecontainer__team {
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
          }

          .search-members-container__member__profile__connect-button {
            border-top: 1px solid #cbd5e1;
            width: 100%;
            height: 28px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            color: #156ff7;
            margin-top: 16px;
          }
        `}
      </style>
    </>
  );
};

export default SearchMembers;
