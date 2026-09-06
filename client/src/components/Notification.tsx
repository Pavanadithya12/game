import React, { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { X } from 'lucide-react';

export default function Notification() {
  const notifications = useGameStore(state => state.notifications);
  const removeNotification = useGameStore(state => state.removeNotification);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(notifications[0].id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[250px] animate-fade-in ${
            notif.type === 'success' ? 'bg-green-600 text-white' :
            notif.type === 'warning' ? 'bg-yellow-500 text-gray-900' :
            'bg-blue-600 text-white'
          }`}
        >
          <span className="font-medium">{notif.message}</span>
          <button 
            onClick={() => removeNotification(notif.id)}
            className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
