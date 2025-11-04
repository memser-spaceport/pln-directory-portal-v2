import Image from 'next/image';

import { GlobeIcon } from '@/components/icons';
import { isLink } from '@/utils/third-party.helper';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import s from './TeamCard.module.scss';
import { getSocialLinkUrl } from '@/utils/common.utils';

interface Props {
  team: {
    uid: string;
    name: string;
    logo: string;
    stage: string;
    website: string;
    shortDescription: string;
  };
}

export function TeamCard(props: Props) {
  const { team } = props;
  const { uid, name, logo, stage, website, shortDescription } = team;

  const { onLandingTeamCardClicked } = useDemoDayAnalytics();

  const isValidWebsite = isLink(website);
  const cardUrl = isValidWebsite ? getSocialLinkUrl(website, 'website') : `https://directory.plnetwork.io/teams/${uid}`;

  const handleCardClick = () => {
    onLandingTeamCardClicked({
      teamUid: uid,
      teamName: name,
      teamWebsite: website,
      isValidWebsite,
      destinationUrl: cardUrl,
    });
  };

  return (
    <a href={cardUrl} target="_blank" rel="noopener noreferrer" onClick={handleCardClick} className={s.root}>
      <div>
        <Image src={logo} alt={`${name} logo`} width={32} height={32} />
      </div>

      <div>
        <div className={s.nameStage}>
          <div className={s.name}>{name}</div>
          <div className={s.stage}>{stage}</div>
        </div>

        <div className={s.description}>{shortDescription}</div>

        <a href={cardUrl} className={s.website} target="_blank" rel="noopener noreferrer">
          <GlobeIcon className={s.globe} />
          <div className={s.link}>{website}</div>
        </a>
      </div>
    </a>
  );
}
