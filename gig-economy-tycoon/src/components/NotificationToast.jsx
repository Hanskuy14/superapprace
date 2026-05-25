import { useEffect, useState } from 'react';

export default function NotificationToast({ notifications }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(notifications);
      const timer = setTimeout(() => setVisible([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] space-y-2 max-w-sm">
      {visible.map((notif, i) => (
        <div
          key={i}
          className={`px-4 py-3 rounded-lg border shadow-lg animate-slide-in text-sm ${
            notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            notif.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}
