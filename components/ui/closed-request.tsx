'use client';

const ClosedRequest = (props: any) => {
  const teams = props?.backOfficedata?.filter((item: any) => item.participantType === 'TEAM' && !['PENDING', 'AUTOAPPROVED'].includes(item.status));

  const formatDateTime = (isoDateTime: string): string => {
    const date = new Date(isoDateTime);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    return formatter.format(date);
  };

  return (
    <div>
      <div className="search-container">
        <img height={15} width={15} src="/icons/search-gray.svg" alt="Search Icon" />
        <input className="search-input" placeholder="Search" />
      </div>
      {teams?.map((team: any, index: number) => (
        <div key={index} className="request-item">
          <div className="request-content">
            <span className="request-name">{team?.newData?.name}</span>
            <div className="request-status">
              {team?.status}
              <div className="request-date">on {formatDateTime(team?.updatedAt)}</div>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .search-container {
          display: flex;
          align-items: center;
        }
        .search-input {
          border: none;
          outline: none;
        }
        .request-item {
          height: 60px;
          width: 656px;
          cursor: pointer;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 0 1px rgba(15, 23, 42, 0.12);
          transition: background 0.3s ease;
        }
        .request-item:hover {
          background: #f8fafc;
        }
        .request-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;
          padding: 0 24px;
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }
        .request-name {
          font-size: 14px;
          font-weight: 600;
        }
        .request-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 12px;
        }
        .request-date {
          font-size: 12px;
          font-style: italic;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ClosedRequest;
