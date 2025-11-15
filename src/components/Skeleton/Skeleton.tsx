import { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width, height, className = '', style }: SkeletonProps): JSX.Element {
  const customStyle: CSSProperties = {
    width: width || '100%',
    height: height || '1em',
    ...style,
  };

  return <div className={`${styles.skeleton} ${className}`} style={customStyle} />;
}
