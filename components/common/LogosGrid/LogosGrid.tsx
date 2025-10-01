import s from './LogosGrid.module.scss';
import clsx from 'clsx';

const icons = [
  '/icons/demoday/landing/logos/Protocol Labs.svg',
  '/icons/demoday/landing/logos/A16zcrypto.svg',
  '/icons/demoday/landing/logos/BlueYard.svg',
  '/icons/demoday/landing/logos/PolychainCapital.svg',
  '/icons/demoday/landing/logos/Y.svg',

  '/icons/demoday/landing/logos/SVAngel.svg',
  '/icons/demoday/landing/logos/Multicoin.svg',
  '/icons/demoday/landing/logos/Framework.svg',
  '/icons/demoday/landing/logos/Placeholder.svg',
  '/icons/demoday/landing/logos/Coinbase.svg',

  '/icons/demoday/landing/logos/DigitalCurrency.svg',
  '/icons/demoday/landing/logos/ElectricCapital.svg',
  '/icons/demoday/landing/logos/Mesh.svg',
  '/icons/demoday/landing/logos/Archetype.svg',
  '/icons/demoday/landing/logos/BBH.svg',

  '/icons/demoday/landing/logos/InsightPartners.svg',
  '/icons/demoday/landing/logos/Spartan.svg',
  '/icons/demoday/landing/logos/ShimaCapital.svg',
  '/icons/demoday/landing/logos/FenbushiCapital.svg',
  '/icons/demoday/landing/logos/AnimocaBrands.svg',

  '/icons/demoday/landing/logos/Collabcurrency.svg',
  '/icons/demoday/landing/logos/Techstars.svg',
  '/icons/demoday/landing/logos/LongHashVentures.svg',
  '/icons/demoday/landing/logos/OutlierVentures.svg',
  '/icons/demoday/landing/logos/Alliance.svg',

  '/icons/demoday/landing/logos/SolanaVentures.svg',
  '/icons/demoday/landing/logos/HashKey.svg',
  '/icons/demoday/landing/logos/KrakenVentures.svg',
  '/icons/demoday/landing/logos/Hashed.svg',
  '/icons/demoday/landing/logos/OrangeDAO.svg',

  '/icons/demoday/landing/logos/DelphiVentures.svg',
  '/icons/demoday/landing/logos/GGVCapital.svg',
  '/icons/demoday/landing/logos/Galaxy.svg',
  '/icons/demoday/landing/logos/IOSGVentures.svg',
  '/icons/demoday/landing/logos/Republic.svg',

  '/icons/demoday/landing/logos/Dialectic.svg',
  '/icons/demoday/landing/logos/TribeCapital.svg',
  '/icons/demoday/landing/logos/Amber.svg',
  '/icons/demoday/landing/logos/AngelList.svg',
];

interface Props {
  className?: string;
}

export function LogosGrid(props: Props) {
  const { className } = props;

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>Past Demo Days have featured teams backed by top Web3 Investors</div>

      <div className={s.grid}>
        {icons.map((icon) => (
          <div key={icon} className={s.cell}>
            <img
              src={icon}
              className={s.logo}
              alt={icon.replace('/icons/demoday/landing/logos/', '').replace('.svg', '')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
