import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@/api';
import { useApiRequestCancel } from '@/hooks/useApi';
import { Card, Button } from '@/components';
import type { StatsPeriod } from '@/types';
import { formatPercentage, formatTime, exportStatsToCSV, exportStatsToPDF } from '@/utils';
import styles from './Stats.module.css';

const COLORS = ['#28a745', '#dc3545', '#ffc107'];

export function Stats(): JSX.Element {
  useApiRequestCancel();

  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalReviewed: 0,
    totalReviewedToday: 0,
    totalReviewedThisWeek: 0,
    totalReviewedThisMonth: 0,
    approvedPercentage: 0,
    rejectedPercentage: 0,
    requestChangesPercentage: 0,
    averageReviewTime: 0,
  });
  const [activityData, setActivityData] = useState<
    Array<{ date: string; approved: number; rejected: number; requestChanges: number }>
  >([]);
  const [decisionsData, setDecisionsData] = useState({
    approved: 0,
    rejected: 0,
    requestChanges: 0,
  });
  const [categoriesData, setCategoriesData] = useState<Array<{ name: string; value: number }>>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, number>>({});

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { period };
      const [summaryData, activityChart, decisionsChart, categoriesChart] = await Promise.all([
        apiClient.getStatsSummary(filters),
        apiClient.getActivityChart(filters),
        apiClient.getDecisionsChart(filters),
        apiClient.getCategoriesChart(filters),
      ]);

      setSummary(summaryData);
      setActivityData(activityChart);
      setDecisionsData(decisionsChart);
      setCategoriesMap(categoriesChart);
      setCategoriesData(Object.entries(categoriesChart).map(([name, value]) => ({ name, value })));
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getTotalReviewed = (): number => {
    switch (period) {
      case 'today':
        return summary.totalReviewedToday;
      case 'week':
      case 'month':
        return summary.totalReviewed;
      default:
        return summary.totalReviewed;
    }
  };

  const decisionsChartData = [
    { name: 'Одобрено', value: decisionsData.approved },
    { name: 'Отклонено', value: decisionsData.rejected },
    { name: 'На доработку', value: decisionsData.requestChanges },
  ];

  if (loading) {
    return <div className={styles.loading}>Загрузка статистики...</div>;
  }

  const handleExportCSV = (): void => {
    exportStatsToCSV(summary, activityData, decisionsData, categoriesMap);
  };

  const handleExportPDF = (): void => {
    exportStatsToPDF(summary, activityData, decisionsData, categoriesMap);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Статистика модератора</h1>
        <div className={styles.exportButtons}>
          <Button onClick={handleExportCSV} variant="secondary" size="small">
            Экспорт CSV
          </Button>
          <Button onClick={handleExportPDF} variant="secondary" size="small">
            Экспорт PDF
          </Button>
        </div>
      </div>

      <div className={styles.periodSelector}>
        <button
          className={`${styles.periodButton} ${period === 'today' ? styles.active : ''}`}
          onClick={() => setPeriod('today')}
        >
          Сегодня
        </button>
        <button
          className={`${styles.periodButton} ${period === 'week' ? styles.active : ''}`}
          onClick={() => setPeriod('week')}
        >
          Последние 7 дней
        </button>
        <button
          className={`${styles.periodButton} ${period === 'month' ? styles.active : ''}`}
          onClick={() => setPeriod('month')}
        >
          Последние 30 дней
        </button>
      </div>

      <div className={styles.metricsGrid}>
        <Card>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Всего проверено</div>
            <div className={styles.metricValue}>{getTotalReviewed()}</div>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Процент одобренных</div>
            <div className={`${styles.metricValue} ${styles.success}`}>
              {formatPercentage(summary.approvedPercentage)}
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Процент отклоненных</div>
            <div className={`${styles.metricValue} ${styles.danger}`}>
              {formatPercentage(summary.rejectedPercentage)}
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Среднее время проверки</div>
            <div className={styles.metricValue}>{formatTime(summary.averageReviewTime)}</div>
          </div>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card>
          <h2 className={styles.chartTitle}>Активность по дням</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#28a745" name="Одобрено" />
              <Bar dataKey="rejected" fill="#dc3545" name="Отклонено" />
              <Bar dataKey="requestChanges" fill="#ffc107" name="На доработку" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className={styles.chartTitle}>Распределение решений</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={decisionsChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {decisionsChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {categoriesData.length > 0 && (
        <Card>
          <h2 className={styles.chartTitle}>Распределение по категориям</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoriesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="value" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
