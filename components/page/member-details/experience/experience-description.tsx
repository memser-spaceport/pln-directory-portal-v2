'use client'
import styles from './list.module.css';
import { useState } from 'react';
export default function ExperienceDescription({ description }: { description: string }) {

    const [showMore, setShowMore] = useState(description.length > 255);

    const handleShowMore = () => {
        setShowMore(!showMore);
    }

  return (
    <div className={styles?.memberDetail__experience__item__detail__description}>
      <p className={styles?.memberDetail__experience__item__detail__description__text}>{showMore ? description.slice(0, 255) : description}</p>
      {showMore && <span className={styles?.memberDetail__experience__item__detail__description__text__more} onClick={handleShowMore}>Show more</span>}
    </div>
  );
}
