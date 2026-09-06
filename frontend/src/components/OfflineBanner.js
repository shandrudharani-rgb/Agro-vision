import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const OfflineBanner = () => {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="text-center py-2 small text-white" style={{ background: '#c0392b' }}>
      <i className="bi bi-wifi-off me-2"></i>
      {t('offlineMessage')}
    </div>
  );
};

export default OfflineBanner;
