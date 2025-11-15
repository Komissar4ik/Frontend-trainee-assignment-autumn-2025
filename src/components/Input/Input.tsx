import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const inputClasses = [styles.input, error && styles.inputError, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={inputClasses} {...props} />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
