'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PushNotification,
  WebSocketEvent,
  NotificationUpdatePayload,
  NotificationCountPayload,
} from '@/types/push-notifications.types';

interface UsePushNotificationsOptions {
  token?: string;
  enabled?: boolean;
  onNewNotification?: (notification: PushNotification) => void;
  onNotificationUpdate?: (payload: NotificationUpdatePayload) => void;
  onCountUpdate?: (payload: NotificationCountPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UsePushNotificationsReturn {
  isConnected: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const WS_URL = process.env.DIRECTORY_API_URL;

export function usePushNotifications(
  options: UsePushNotificationsOptions
): UsePushNotificationsReturn {
  const {
    token,
    enabled = true,
    onNewNotification,
    onNotificationUpdate,
    onCountUpdate,
    onConnectionChange,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callbacks in refs to avoid reconnection on callback changes
  const callbacksRef = useRef({
    onNewNotification,
    onNotificationUpdate,
    onCountUpdate,
    onConnectionChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewNotification,
      onNotificationUpdate,
      onCountUpdate,
      onConnectionChange,
    };
  }, [onNewNotification, onNotificationUpdate, onCountUpdate, onConnectionChange]);

  useEffect(() => {
    if (!enabled || !token || !WS_URL) {
      return;
    }

    const socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      callbacksRef.current.onConnectionChange?.(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      callbacksRef.current.onConnectionChange?.(false);
    });

    socket.on(WebSocketEvent.CONNECTION_ERROR, (data) => {
      setError(data.message);
    });

    socket.on(WebSocketEvent.NOTIFICATION_NEW, (notification: PushNotification) => {
      callbacksRef.current.onNewNotification?.(notification);
    });

    socket.on(WebSocketEvent.NOTIFICATION_UPDATE, (payload: NotificationUpdatePayload) => {
      callbacksRef.current.onNotificationUpdate?.(payload);
    });

    socket.on(WebSocketEvent.NOTIFICATION_COUNT, (payload: NotificationCountPayload) => {
      callbacksRef.current.onCountUpdate?.(payload);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, enabled]);

  const markAsRead = useCallback((id: string) => {
    socketRef.current?.emit(WebSocketEvent.MARK_READ, { id });
  }, []);

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit(WebSocketEvent.MARK_ALL_READ);
  }, []);

  return {
    isConnected,
    error,
    markAsRead,
    markAllAsRead,
  };
}
