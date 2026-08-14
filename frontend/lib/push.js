import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Requests notification permission and subscribes the current device to push.
 * Returns 'granted' | 'denied' | 'unsupported' | 'unconfigured' (no VAPID key set up yet).
 */
export async function subscribeToPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const { data } = await api.get('/push/vapid-public-key');
  if (!data.publicKey) return 'unconfigured';

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
  });

  const raw = subscription.toJSON();
  await api.post('/push/subscribe', { endpoint: raw.endpoint, keys: raw.keys });
  return 'granted';
}
