import { Fragment } from 'react';
import Link from 'next/link';

import { IApiInfo } from '@/utils/api-info.utils';

import styles from './api-info.module.scss';

interface IApiInfoProps {
  info: IApiInfo;
}

const ApiInfo = ({ info }: IApiInfoProps) => {
  const details: { label: string; value: string }[] = [
    { label: 'Service', value: info.service },
    { label: 'Environment', value: info.environment },
    { label: 'Version', value: info.version },
    { label: 'Feature', value: info.feature },
    { label: 'Timestamp (UTC)', value: info.timestamp },
  ];

  return (
    <section className={styles.apiInfo} aria-labelledby="api-info-title">
      <h1 className={styles.apiInfo__title} id="api-info-title">
        API Info
      </h1>
      <dl className={styles.apiInfo__list}>
        {details.map((detail) => (
          <Fragment key={detail.label}>
            <dt className={styles.apiInfo__term}>{detail.label}</dt>
            <dd className={styles.apiInfo__value}>{detail.value}</dd>
          </Fragment>
        ))}
      </dl>
      <Link className={styles.apiInfo__homeLink} href="/">
        Back to home page
      </Link>
    </section>
  );
};

export default ApiInfo;
