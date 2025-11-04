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

  const { onLandingTeamCardClicked, onLandingTeamWebsiteClicked } = useDemoDayAnalytics();

  const websiteLink = website.split(' ')[0];
  const isValidWebsite = isLink(websiteLink);
  const teamPageUrl = `https://directory.plnetwork.io/teams/${uid}`;
  const websiteUrl = isValidWebsite ? getSocialLinkUrl(websiteLink, 'website') : null;

  const handleCardClick = () => {
    onLandingTeamCardClicked({
      teamUid: uid,
      teamName: name,
      teamWebsite: website,
      destinationUrl: teamPageUrl,
    });
  };

  const handleWebsiteClick = () => {
    onLandingTeamWebsiteClicked({
      teamUid: uid,
      teamName: name,
      teamWebsite: website,
      destinationUrl: websiteUrl,
    });
  };

  return (
    <a href={teamPageUrl} target="_blank" rel="noopener noreferrer" onClick={handleCardClick} className={s.root}>
      <div>
        <Image src={logo} alt={`${name} logo`} width={32} height={32} />
      </div>

      <div>
        <div className={s.nameStage}>
          <div className={s.name}>{name}</div>
          <div className={s.stage}>{stage}</div>
        </div>

        <div className={s.description}>{shortDescription}</div>

        <a
          href={websiteUrl || teamPageUrl}
          className={s.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWebsiteClick}
        >
          <GlobeIcon className={s.globe} />
          <div className={s.link}>{website}</div>
        </a>
      </div>
    </a>
  );
}
