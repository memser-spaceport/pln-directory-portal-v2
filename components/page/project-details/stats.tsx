'use client';

import StatsCard from './stats-card';

interface IProjectStats {
  stats: any;
}

const ProjectStats = (props: IProjectStats) => {
  const stats = props?.stats;

  return (
    <>
      <div className="stats">
        <h6 className="stats__title">Project Stats</h6>
        <div className="stats__container">
          <div className="stats__container__card">
            <StatsCard statsName="Forks" count={stats?.forkCount ?? 0} icon="/icons/fork.svg" />
          </div>
          <div className="stats__container__card">
            <StatsCard statsName="Stars" count={stats?.starCount ?? 0} icon="/icons/star-outline-gray.svg" />
          </div>
          <div className="stats__container__card">
            <StatsCard statsName="Repos" count={stats?.repositoryCount ?? 0} icon="/icons/repos.svg" />
          </div>
          <div className="stats__container__card">
            <StatsCard statsName="Contributors" count={stats?.contributorCount ?? 0} icon="/icons/contributors.svg" newContributors={stats?.newContributorCount6Months ?? 0} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stats__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .stats__container {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .stats__container__card {
          width: 159px;
          height: 88px;
        }

        @media (min-width: 1024px) {
        .stats__container__card {
          width: 206.75px;
          height: 88px;
        }
          }
      `}</style>
    </>
  );
};

export default ProjectStats;
