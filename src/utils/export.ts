import type { ActivityData, DecisionsData, StatsSummary } from '@/types';

export function exportStatsToCSV(
  summary: StatsSummary,
  activity: ActivityData[],
  decisions: DecisionsData,
  categories: Record<string, number>
): void {
  const rows: string[] = [];

  rows.push('Статистика модератора');
  rows.push('');
  rows.push('Общая статистика');
  rows.push(`Всего проверено,${summary.totalReviewed}`);
  rows.push(`Проверено сегодня,${summary.totalReviewedToday}`);
  rows.push(`Проверено за неделю,${summary.totalReviewedThisWeek}`);
  rows.push(`Проверено за месяц,${summary.totalReviewedThisMonth}`);
  rows.push(`Процент одобренных,${summary.approvedPercentage}%`);
  rows.push(`Процент отклоненных,${summary.rejectedPercentage}%`);
  rows.push(`Процент на доработку,${summary.requestChangesPercentage}%`);
  rows.push(`Среднее время проверки,${summary.averageReviewTime} сек`);
  rows.push('');
  rows.push('Активность по дням');
  rows.push('Дата,Одобрено,Отклонено,На доработку');
  activity.forEach((item) => {
    rows.push(`${item.date},${item.approved},${item.rejected},${item.requestChanges}`);
  });
  rows.push('');
  rows.push('Распределение решений');
  rows.push(`Одобрено,${decisions.approved}%`);
  rows.push(`Отклонено,${decisions.rejected}%`);
  rows.push(`На доработку,${decisions.requestChanges}%`);
  rows.push('');
  rows.push('Распределение по категориям');
  rows.push('Категория,Количество');
  Object.entries(categories).forEach(([category, count]) => {
    rows.push(`${category},${count}`);
  });

  const csvContent = rows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `stats-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportStatsToPDF(
  summary: StatsSummary,
  activity: ActivityData[],
  decisions: DecisionsData,
  categories: Record<string, number>
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Статистика модератора</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>Статистика модератора</h1>
      <h2>Общая статистика</h2>
      <table>
        <tr><th>Метрика</th><th>Значение</th></tr>
        <tr><td>Всего проверено</td><td>${summary.totalReviewed}</td></tr>
        <tr><td>Проверено сегодня</td><td>${summary.totalReviewedToday}</td></tr>
        <tr><td>Проверено за неделю</td><td>${summary.totalReviewedThisWeek}</td></tr>
        <tr><td>Проверено за месяц</td><td>${summary.totalReviewedThisMonth}</td></tr>
        <tr><td>Процент одобренных</td><td>${summary.approvedPercentage}%</td></tr>
        <tr><td>Процент отклоненных</td><td>${summary.rejectedPercentage}%</td></tr>
        <tr><td>Процент на доработку</td><td>${summary.requestChangesPercentage}%</td></tr>
        <tr><td>Среднее время проверки</td><td>${summary.averageReviewTime} сек</td></tr>
      </table>
      <h2>Активность по дням</h2>
      <table>
        <tr><th>Дата</th><th>Одобрено</th><th>Отклонено</th><th>На доработку</th></tr>
        ${activity
          .map(
            (item) =>
              `<tr><td>${item.date}</td><td>${item.approved}</td><td>${item.rejected}</td><td>${item.requestChanges}</td></tr>`
          )
          .join('')}
      </table>
      <h2>Распределение решений</h2>
      <table>
        <tr><th>Решение</th><th>Процент</th></tr>
        <tr><td>Одобрено</td><td>${decisions.approved}%</td></tr>
        <tr><td>Отклонено</td><td>${decisions.rejected}%</td></tr>
        <tr><td>На доработку</td><td>${decisions.requestChanges}%</td></tr>
      </table>
      <h2>Распределение по категориям</h2>
      <table>
        <tr><th>Категория</th><th>Количество</th></tr>
        ${Object.entries(categories)
          .map(([category, count]) => `<tr><td>${category}</td><td>${count}</td></tr>`)
          .join('')}
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

