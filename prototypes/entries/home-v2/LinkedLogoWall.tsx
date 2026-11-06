'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { LOGOS } from '@/components/common/LogosGrid/constants';
import s from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall.module.scss';
import local from './HomeV2Prototype.module.scss';

const logoName = (path: string) => path.replace('/icons/demoday/landing/logos/', '').replace('.svg', '');

/**
 * Each backer's own site, keyed by the logo file's name. Angels link to their
 * own site or profile. A logo missing here (no site we could vouch for) stays
 * a plain image.
 */
const LOGO_HREF: Record<string, string> = {
  'Protocol Labs': 'https://protocol.ai',
  A16zcrypto: 'https://a16zcrypto.com',
  Coinbase: 'https://www.coinbase.com/ventures',
  HashKey: 'https://hashkey.capital',
  BlueYard: 'https://blueyard.com',
  Multicoin: 'https://multicoin.capital',
  PolychainCapital: 'https://polychain.capital',
  Y: 'https://www.ycombinator.com',
  PanteraCapital: 'https://panteracapital.com',
  GreyCroft: 'https://www.greycroft.com',
  KleinerPerkins: 'https://www.kleinerperkins.com',
  Redpoint: 'https://www.redpoint.com',
  UnionVentures: 'https://www.usv.com',
  Venrock: 'https://www.venrock.com',
  Galaxy: 'https://www.galaxy.com',
  InsightPartners: 'https://www.insightpartners.com',
  JuanBenet: 'https://x.com/juanbenet',
  BalajiSrinivasan: 'https://balajis.com',
  VitalikButerin: 'https://vitalik.eth.limo',
  AnatolyYakovenko: 'https://x.com/aeyakovenko',
  DigitalCurrency: 'https://dcg.co',
  FenbushiCapital: 'https://www.fenbushi.vc',
  Hashed: 'https://www.hashed.com',
  TribeCapital: 'https://tribecap.co',
  Jump: 'https://jumpcrypto.com',
  Sosv: 'https://sosv.com',
  CoinFund: 'https://coinfund.io',
  Amber: 'https://www.ambergroup.io',
  AngelList: 'https://www.angellist.com',
  AnimocaBrands: 'https://www.animocabrands.com',
  DelphiVentures: 'https://delphiventures.io',
  GGVCapital: 'https://www.notablecap.com',
  IOSGVentures: 'https://iosg.vc',
  Republic: 'https://republic.com',
  SolanaVentures: 'https://solana.ventures',
  Spartan: 'https://www.spartangroup.io',
  SVAngel: 'https://svangel.com',
  ElectricCapital: 'https://www.electriccapital.com',
  OrangeDAO: 'https://www.orangedao.xyz',
  Alliance: 'https://alliance.xyz',
  BigBrainHolding: 'https://bigbrain.holdings',
  Collabcurrency: 'https://www.collabcurrency.com',
  Placeholder: 'https://www.placeholder.vc',
  ShimaCapital: 'https://shima.capital',
  NorthZone: 'https://northzone.com',
  FJLabs: 'https://www.fjlabs.com',
  Dialectic: 'https://dialectic.ch',
  Arca: 'https://www.arca.digital',
  Borderless: 'https://www.borderless.capital',
  MechanismCapital: 'https://www.mechanism.capital',
  HiveMind: 'https://www.hivemind.capital',
  FabricVentures: 'https://www.fabric.vc',
  Framework: 'https://framework.ventures',
  JustinKan: 'https://x.com/justinkan',
  ChrisLarsen: 'https://en.wikipedia.org/wiki/Chris_Larsen_(businessman)',
  GSR: 'https://www.gsr.io',
  Techstars: 'https://www.techstars.com',
  LongHashVentures: 'https://www.longhash.vc',
  Eniac: 'https://eniac.vc',
  LDCapital: 'https://ldcap.com',
  LightspeedAction: 'https://lightspeedfaction.com',
  CmtDigital: 'https://cmt.digital',
  Archetype: 'https://www.archetype.fund',
  KrakenVentures: 'https://www.kraken.com',
  OutlinerVentures: 'https://outlierventures.io',
};

/**
 * 2026-11-06: production `ExploreLogoWall` with each logo linked to the
 * backer's site (new tab). Same markup and SCSS as production; only the `<a>`
 * around each image is new. Production's list is image paths only, so the
 * links live here until the data carries them.
 */
export function LinkedLogoWall() {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className={s.root}>
      <h2 className={s.header}>PL Network teams have raised from top VCs and angel investors</h2>

      <div className={clsx(s.gridContainer, { [s.expanded]: showAll })}>
        <ul className={s.grid}>
          {LOGOS.map((icon) => {
            const name = logoName(icon);
            const href = LOGO_HREF[name];
            const img = <img src={icon} className={s.logo} alt={name} loading="lazy" />;
            return (
              <li key={icon} className={s.cell}>
                {href ? (
                  <a className={local.logoLink} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} (opens in a new tab)`}>
                    {img}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
        <div className={s.bottomShadow} aria-hidden />
      </div>

      <Button size="s" style="border" className={s.btn} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
        Show {showAll ? 'Less' : 'All'}
      </Button>
    </div>
  );
}
