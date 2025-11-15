import { Button, Input } from '@/components';
import type { RejectionReason } from '@/types';
import styles from './RejectionModal.module.css';

interface RejectionModalProps {
  title: string;
  selectedReason: RejectionReason;
  onReasonChange: (reason: RejectionReason) => void;
  customReason: string;
  onCustomReasonChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmVariant: 'danger' | 'warning';
  loading: boolean;
  rejectionReasons: RejectionReason[];
}

export function RejectionModal({
  title,
  selectedReason,
  onReasonChange,
  customReason,
  onCustomReasonChange,
  comment,
  onCommentChange,
  onClose,
  onConfirm,
  confirmLabel,
  confirmVariant,
  loading,
  rejectionReasons,
}: RejectionModalProps): JSX.Element {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <div className={styles.modalContent}>
          <label className={styles.modalLabel}>Причина:</label>
          <select
            className={styles.modalSelect}
            value={selectedReason}
            onChange={(e) => {
              const value = e.target.value;
              const isValidReason = (reason: string): reason is RejectionReason => {
                return (
                  reason === 'Запрещенный товар' ||
                  reason === 'Неверная категория' ||
                  reason === 'Некорректное описание' ||
                  reason === 'Проблемы с фото' ||
                  reason === 'Подозрение на мошенничество' ||
                  reason === 'Другое'
                );
              };
              if (isValidReason(value)) {
                onReasonChange(value);
              }
            }}
          >
            {rejectionReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
          {selectedReason === 'Другое' && (
            <Input
              placeholder="Укажите причину"
              value={customReason}
              onChange={(e) => onCustomReasonChange(e.target.value)}
            />
          )}
          <Input
            label="Комментарий (необязательно)"
            placeholder="Дополнительный комментарий"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
        </div>
        <div className={styles.modalActions}>
          <Button onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button onClick={onConfirm} variant={confirmVariant} disabled={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
