import { Skeleton } from '../Skeleton';
import styles from './AdCardSkeleton.module.css';

export function AdCardSkeleton(): JSX.Element {
  return (
    <div className={styles.card}>
      <Skeleton height={200} className={styles.image} />
      <div className={styles.content}>
        <Skeleton height={24} width="80%" className={styles.title} />
        <Skeleton height={28} width="60%" className={styles.price} />
        <div className={styles.meta}>
          <Skeleton height={16} width="40%" />
          <Skeleton height={16} width="40%" />
        </div>
        <div className={styles.badges}>
          <Skeleton height={24} width={100} />
          <Skeleton height={24} width={80} />
        </div>
      </div>
    </div>
  );
}

