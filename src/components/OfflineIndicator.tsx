import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      id="offline-banner"
      className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline. Explore CNC is running from cached PWA storage. Direct Wi-Fi controls will work over local AP network.</span>
    </div>
  );
};
