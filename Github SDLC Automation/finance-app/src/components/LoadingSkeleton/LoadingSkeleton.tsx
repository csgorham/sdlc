import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
}

export function LoadingSkeleton({ count = 5 }: LoadingSkeletonProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.shimmer} />
        </div>
      ))}
    </div>
  );
}
