import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/api';
import { useCancelOnUnmount } from '@/hooks/useApi';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Card, Button, RejectionModal } from '@/components';
import type { Advertisement, RejectionReason, AddsFilters } from '@/types';
import { formatPrice, formatDateString } from '@/utils';
import { getStatusLabel, getPriorityLabel, getActionLabel } from '@/utils/status';
import styles from './AddDetail.module.css';

const REJECTION_REASONS: RejectionReason[] = [
  'Запрещенный товар',
  'Неверная категория',
  'Некорректное описание',
  'Проблемы с фото',
  'Подозрение на мошенничество',
  'Другое',
];

export function AddDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const adId = Number(id);

  useCancelOnUnmount(`getAd-${adId}`);

  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RejectionReason>('Другое');
  const [comment, setComment] = useState('');
  const [customReason, setCustomReason] = useState('');

  const loadAd = useCallback(async () => {
    if (!adId) {
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.getAdById(adId);
      setAd(data);
    } catch (error) {
      console.error('Failed to load ad:', error);
    } finally {
      setLoading(false);
    }
  }, [adId]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const handleApprove = async (): Promise<void> => {
    if (!ad) {
      return;
    }
    setActionLoading(true);
    try {
      const updatedAd = await apiClient.approveAd(ad.id);
      setAd(updatedAd);
    } catch (error) {
      console.error('Failed to approve ad:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getReasonValue = (): string => {
    return selectedReason === 'Другое' ? customReason : selectedReason;
  };

  const resetModalState = (): void => {
    setComment('');
    setCustomReason('');
  };

  const handleAction = async (
    action: (
      id: number,
      data: { reason: RejectionReason; comment: string }
    ) => Promise<Advertisement>,
    onSuccess: () => void
  ): Promise<void> => {
    if (!ad) {
      return;
    }
    const reason = getReasonValue();
    if (!reason.trim()) {
      return;
    }
    setActionLoading(true);
    try {
      const updatedAd = await action(ad.id, {
        reason: selectedReason,
        comment: comment || reason,
      });
      setAd(updatedAd);
      onSuccess();
      resetModalState();
    } catch (error) {
      console.error('Failed to perform action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (): Promise<void> => {
    await handleAction(apiClient.rejectAd.bind(apiClient), () => {
      setShowRejectModal(false);
    });
  };

  const handleRequestChanges = async (): Promise<void> => {
    await handleAction(apiClient.requestChanges.bind(apiClient), () => {
      setShowRequestChangesModal(false);
    });
  };

  const loadAdjacentAd = async (direction: 'next' | 'prev'): Promise<void> => {
    if (!ad) {
      return;
    }
    try {
      const filters: AddsFilters = {
        limit: 100,
        page: 1,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };
      const response = await apiClient.getAds(filters);
      const currentIndex = response.adds.findIndex((a: Advertisement) => a.id === ad.id);
      const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      const isValidIndex =
        direction === 'next'
          ? currentIndex >= 0 && currentIndex < response.adds.length - 1
          : currentIndex > 0;

      if (isValidIndex && targetIndex >= 0 && targetIndex < response.adds.length) {
        navigate(`/item/${response.adds[targetIndex].id}`);
      }
    } catch (error) {
      console.error(`Failed to load ${direction === 'next' ? 'next' : 'previous'} ad:`, error);
    }
  };

  const loadNextAd = async (): Promise<void> => {
    await loadAdjacentAd('next');
  };

  const loadPrevAd = async (): Promise<void> => {
    await loadAdjacentAd('prev');
  };

  useKeyboardShortcuts({
    onApprove: () => {
      if (ad && ad.status !== 'approved' && !actionLoading) {
        handleApprove();
      }
    },
    onReject: () => {
      if (ad && ad.status !== 'rejected' && !actionLoading && !showRejectModal) {
        setShowRejectModal(true);
      }
    },
    onNext: () => {
      if (!actionLoading) {
        loadNextAd();
      }
    },
    onPrev: () => {
      if (!actionLoading) {
        loadPrevAd();
      }
    },
  });

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!ad) {
    return <div className={styles.error}>Объявление не найдено</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button onClick={() => navigate('/list')} variant="secondary">
          ← Назад к списку
        </Button>
        <div className={styles.navigation}>
          <Button onClick={loadPrevAd} variant="secondary" disabled={actionLoading}>
            ← Предыдущее
          </Button>
          <Button onClick={loadNextAd} variant="secondary" disabled={actionLoading}>
            Следующее →
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <Card>
            <h1 className={styles.title}>{ad.title}</h1>
            <div className={styles.price}>{formatPrice(ad.price)}</div>
            <div className={styles.meta}>
              <span className={styles.category}>{ad.category}</span>
              <span className={styles.date}>{formatDateString(ad.createdAt)}</span>
              <span className={`${styles.status} ${styles[`status-${ad.status}`]}`}>
                {getStatusLabel(ad.status)}
              </span>
              <span className={`${styles.priority} ${styles[`priority-${ad.priority}`]}`}>
                {getPriorityLabel(ad.priority)}
              </span>
            </div>
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>Галерея изображений</h2>
            <div className={styles.gallery}>
              {ad.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${ad.title} ${index + 1}`}
                  className={styles.galleryImage}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>Описание</h2>
            <p className={styles.description}>{ad.description}</p>
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>Характеристики</h2>
            <table className={styles.characteristicsTable}>
              <tbody>
                {Object.entries(ad.characteristics).map(([key, value]) => (
                  <tr key={key}>
                    <td className={styles.characteristicKey}>{key}</td>
                    <td className={styles.characteristicValue}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>Информация о продавце</h2>
            <div className={styles.sellerInfo}>
              <div className={styles.sellerField}>
                <span className={styles.sellerLabel}>Имя:</span>
                <span className={styles.sellerValue}>{ad.seller.name}</span>
              </div>
              <div className={styles.sellerField}>
                <span className={styles.sellerLabel}>Рейтинг:</span>
                <span className={styles.sellerValue}>{ad.seller.rating}</span>
              </div>
              <div className={styles.sellerField}>
                <span className={styles.sellerLabel}>Объявлений:</span>
                <span className={styles.sellerValue}>{ad.seller.totalAdds}</span>
              </div>
              <div className={styles.sellerField}>
                <span className={styles.sellerLabel}>Дата регистрации:</span>
                <span className={styles.sellerValue}>
                  {formatDateString(ad.seller.registeredAt)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className={styles.sectionTitle}>История модерации</h2>
            {ad.moderationHistory.length === 0 ? (
              <p className={styles.noHistory}>История модерации отсутствует</p>
            ) : (
              <div className={styles.historyList}>
                {ad.moderationHistory.map((entry) => (
                  <div key={entry.id} className={styles.historyItem}>
                    <div className={styles.historyHeader}>
                      <span className={styles.historyModerator}>{entry.moderatorName}</span>
                      <span className={styles.historyDate}>
                        {formatDateString(entry.timestamp)}
                      </span>
                    </div>
                    <div className={styles.historyAction}>{getActionLabel(entry.action)}</div>
                    {entry.reason && (
                      <div className={styles.historyReason}>Причина: {entry.reason}</div>
                    )}
                    {entry.comment && (
                      <div className={styles.historyComment}>Комментарий: {entry.comment}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card>
            <h2 className={styles.sectionTitle}>Действия модератора</h2>
            <div className={styles.actions}>
              <Button
                onClick={handleApprove}
                variant="success"
                disabled={actionLoading || ad.status === 'approved'}
                className={styles.actionButton}
              >
                Одобрить
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                variant="danger"
                disabled={actionLoading || ad.status === 'rejected'}
                className={styles.actionButton}
              >
                Отклонить
              </Button>
              <Button
                onClick={() => setShowRequestChangesModal(true)}
                variant="warning"
                disabled={actionLoading}
                className={styles.actionButton}
              >
                Вернуть на доработку
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showRejectModal && (
        <RejectionModal
          title="Отклонить объявление"
          selectedReason={selectedReason}
          onReasonChange={setSelectedReason}
          customReason={customReason}
          onCustomReasonChange={setCustomReason}
          comment={comment}
          onCommentChange={setComment}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          confirmLabel="Отклонить"
          confirmVariant="danger"
          loading={actionLoading}
          rejectionReasons={REJECTION_REASONS}
        />
      )}

      {showRequestChangesModal && (
        <RejectionModal
          title="Вернуть на доработку"
          selectedReason={selectedReason}
          onReasonChange={setSelectedReason}
          customReason={customReason}
          onCustomReasonChange={setCustomReason}
          comment={comment}
          onCommentChange={setComment}
          onClose={() => setShowRequestChangesModal(false)}
          onConfirm={handleRequestChanges}
          confirmLabel="Вернуть на доработку"
          confirmVariant="warning"
          loading={actionLoading}
          rejectionReasons={REJECTION_REASONS}
        />
      )}
    </div>
  );
}
