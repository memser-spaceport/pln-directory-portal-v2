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
  /** Interval in milliseconds to check connection health. Default: 30000 (30 seconds) */
  healthCheckInterval?: number;
}

interface UsePushNotificationsReturn {
  isConnected: boolean;
  connectionEstablished: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  reconnect: () => void;
}

const WS_URL = process.env.DIRECTORY_API_URL;
const DEFAULT_HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY_MS = 2000;
const RECONNECTION_DELAY_MAX_MS = 10000;

export function usePushNotifications(options: UsePushNotificationsOptions): UsePushNotificationsReturn {
  const {
    token,
    enabled = true,
    onNewNotification,
    onNotificationUpdate,
    onCountUpdate,
    onConnectionChange,
    healthCheckInterval = DEFAULT_HEALTH_CHECK_INTERVAL,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionEstablished, setConnectionEstablished] = useState(false);
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

  const createSocket = useCallback(() => {
    if (!token || !WS_URL) {
      return null;
    }

    const socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY_MS,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
      timeout: 20000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      callbacksRef.current.onConnectionChange?.(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionEstablished(false);
      callbacksRef.current.onConnectionChange?.(false);
    });

    socket.on(WebSocketEvent.CONNECTION_SUCCESS, () => {
      setConnectionEstablished(true);
    });

    socket.on(WebSocketEvent.CONNECTION_ERROR, (data) => {
      setError(data.message);
    });

    // Stop the health check once Socket.IO has exhausted its retries —
    // otherwise the 30s timer would re-trigger socket.connect() and start
    // a fresh round of attempts against a permanently-broken connection.
    socket.io.on('reconnect_failed', () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
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

    return socket;
  }, [token]);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, []);

  // Check connection health and reconnect if needed
  const checkConnectionHealth = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    if (!socket.connected) {
      // Socket exists but is not connected, attempt to reconnect
      socket.connect();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !token || !WS_URL) {
      return;
    }

    // Create and store socket
    const socket = createSocket();
    if (!socket) {
      return;
    }
    socketRef.current = socket;

    // Set up periodic health check
    healthCheckIntervalRef.current = setInterval(checkConnectionHealth, healthCheckInterval);

    return () => {
      // Clear health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }

      // Disconnect socket
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionEstablished(false);
    };
  }, [token, enabled, createSocket, checkConnectionHealth, healthCheckInterval]);

  const markAsRead = useCallback((id: string) => {
    socketRef.current?.emit(WebSocketEvent.MARK_READ, { id });
  }, []);

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit(WebSocketEvent.MARK_ALL_READ);
  }, []);

  return {
    isConnected,
    connectionEstablished,
    error,
    markAsRead,
    markAllAsRead,
    reconnect,
  };
}
