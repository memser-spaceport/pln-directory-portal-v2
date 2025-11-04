import Image from 'next/image';

import { GlobeIcon } from '@/components/icons';

import s from './TeamCard.module.scss';

interface Props {
  team: {
    name: string;
    logo: string;
    stage: string;
    website: string;
    shortDescription: string;
  };
}

export function TeamCard(props: Props) {
  const { team } = props;
  const { name, logo, stage, website, shortDescription } = team;

  return (
    <div className={s.root}>
      <div>
        <Image src={logo} alt={`${name} logo`} width={32} height={32} />
      </div>

      <div>
        <div className={s.nameStage}>
          <div className={s.name}>{name}</div>
          <div className={s.stage}>{stage}</div>
        </div>

        <div className={s.description}>{shortDescription}</div>

        <a href={website} className={s.website} target="_blank" rel="noopener noreferrer">
          <GlobeIcon className={s.globe} />
          <div className={s.link}>{website}</div>
        </a>
      </div>
    </div>
  );
}
