let updateInterval: NodeJS.Timeout | null = null;
const subscribers: Set<() => void> = new Set();

export function startRealtimeUpdates(callback: () => void, intervalMs: number = 30000): void {
  subscribers.add(callback);
  if (!updateInterval) {
    updateInterval = setInterval(() => {
      subscribers.forEach((sub) => sub());
    }, intervalMs);
  }
}

export function stopRealtimeUpdates(callback: () => void): void {
  subscribers.delete(callback);
  if (subscribers.size === 0 && updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}
