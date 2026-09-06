/**
 * Lightweight offline-sync helper. When a POST request fails because the
 * device is offline, queue it in localStorage. When the browser fires the
 * 'online' event, replay queued requests in order via the provided axios
 * instance. This covers the "Offline AI Mode" requirement's sync behavior
 * without needing a full service-worker/IndexedDB setup.
 */
const QUEUE_KEY = 'agri_offline_queue';

export function queueRequest(method, url, data) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ method, url, data, queuedAt: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue() {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
}

export async function flushQueue(api) {
  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const req of queue) {
    try {
      await api({ method: req.method, url: req.url, data: req.data });
    } catch {
      remaining.push(req);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export function initOfflineSync(api) {
  window.addEventListener('online', () => flushQueue(api));
}
