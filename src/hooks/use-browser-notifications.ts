'use client';

import { useEffect, useRef } from 'react';

function showBrowserNotification(title: string, options: NotificationOptions) {
    if (document.visibilityState === 'visible') {
        return;
    }
    
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            ...options,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

export function useBrowserNotifier(
    unreadNotificationsCount: number
) {
    const prevUnreadNotifications = useRef(unreadNotificationsCount);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        if (unreadNotificationsCount > prevUnreadNotifications.current) {
            showBrowserNotification('Notifikasi Baru di Nusakarsa', {
                body: 'Anda memiliki notifikasi baru.',
                tag: 'new-notification',
            });
        }
        prevUnreadNotifications.current = unreadNotificationsCount;
    }, [unreadNotificationsCount]);
}
