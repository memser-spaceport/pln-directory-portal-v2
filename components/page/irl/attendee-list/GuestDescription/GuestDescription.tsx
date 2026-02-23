import { useState } from 'react';

import s from './GuestDescription.module.scss';

interface Props {
  description: string;
}

export function GuestDescription(props: Props) {
  const description = props?.description ?? '';
  const [isReadMore, setIsReadMore] = useState(true);

  const needsTruncation = description.length > 50;

  return (
    <div className={s.description}>
      {needsTruncation && isReadMore ? `${description.slice(0, 50)}...` : description}
      {needsTruncation && (
        <span onClick={() => setIsReadMore(!isReadMore)} className={s.toggle}>
          {isReadMore ? ' read more' : ' read less'}
        </span>
      )}
    </div>
  );
}
