// src/context/SocketContext.jsx
/**
 * Socket Context Module
 * @module SocketContext
 * @description Enterprise-grade WebSocket/Socket.IO connection management with
 *              automatic reconnection, event queuing, and comprehensive error handling.
 *              Connections are deferred until the user is authenticated.
 * @version 4.2.0
 */

import React from "react";
import { io } from "socket.io-client";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const DEFAULT_SOCKET_CONFIG = {
  autoConnect: true,
  queueOfflineEvents: true,
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  heartbeatInterval: 30000,
  enableDebug: true, // Set to true for debugging
  suppressErrors: false,
  maxConnectionAttempts: 5,
};

const DEFAULT_IO_OPTIONS = {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
  autoConnect: false,
  forceNew: true,
  withCredentials: true,
};

const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  RECONNECT: "reconnect",
  RECONNECT_ATTEMPT: "reconnect_attempt",
  RECONNECT_ERROR: "reconnect_error",
  RECONNECT_FAILED: "reconnect_failed",
  ERROR: "error",
  PING: "ping",
  PONG: "pong",
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns the stored auth token from either storage location.
 * Mirrors the logic in authService so SocketContext has no import cycle.
 */
const getStoredToken = () => {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    null
  );
};

/**
 * Check if backend server is reachable
 */
const checkServerReachability = async (url) => {
  try {
    const baseUrl = url.replace(/\/socket\.io.*$/, "");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/health`, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);
    return response !== null;
  } catch {
    return false;
  }
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

export const SocketContext = React.createContext(null);
SocketContext.displayName = "SocketContext";

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Socket Provider Component
 *
 * The socket connection is only opened once the user is authenticated
 * (i.e. a token is present in storage). It listens to the custom
 * "auth:login" and "auth:logout" window events dispatched by authService
 * to connect / disconnect automatically as the auth state changes.
 *
 * @param {Object}            props
 * @param {React.ReactNode}   props.children
 * @param {string}            [props.url]
 * @param {Object}            [props.config]
 * @param {Function}          [props.onConnect]
 * @param {Function}          [props.onDisconnect]
 * @param {Function}          [props.onError]
 */
export const SocketProvider = ({
  children,
  url,
  config = {},
  onConnect,
  onDisconnect,
  onError,
}) => {
  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------
  const mergedConfig = { ...DEFAULT_SOCKET_CONFIG, ...config };
  const socketUrl =
    url || import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [socket, setSocket] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState(null);
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const [connectionId, setConnectionId] = React.useState(null);
  const [serverReachable, setServerReachable] = React.useState(true);

  // Refs
  const socketRef = React.useRef(null);
  const eventQueueRef = React.useRef([]);
  const heartbeatIntervalRef = React.useRef(null);
  const reconnectTimeoutRef = React.useRef(null);
  const mountedRef = React.useRef(true);
  const debugRef = React.useRef(mergedConfig.enableDebug);
  const connectionAttemptsRef = React.useRef(0);
  const lastErrorRef = React.useRef(null);
  const manualDisconnectRef = React.useRef(false);

  // --------------------------------------------------------------------------
  // Debug Utilities
  // --------------------------------------------------------------------------
  const debugLog = React.useCallback((...args) => {
    if (debugRef.current && import.meta.env.DEV) {
      console.log(`[Socket:${new Date().toISOString()}]`, ...args);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Queue Management
  // --------------------------------------------------------------------------

  const queueEvent = React.useCallback(
    (event, data) => {
      if (eventQueueRef.current.length >= mergedConfig.maxQueueSize) {
        debugLog("Event queue full, dropping oldest event");
        eventQueueRef.current.shift();
      }
      eventQueueRef.current.push({
        event,
        data,
        timestamp: Date.now(),
        retries: 0,
      });
      debugLog(
        `Event queued: ${event}, queue size: ${eventQueueRef.current.length}`,
      );
    },
    [mergedConfig.maxQueueSize, debugLog],
  );

  const processEventQueue = React.useCallback(() => {
    if (!isConnected || !socketRef.current) return;

    if (eventQueueRef.current.length > 0) {
      debugLog(`Processing ${eventQueueRef.current.length} queued events`);
      const queue = [...eventQueueRef.current];
      eventQueueRef.current = [];

      queue.forEach((queuedEvent) => {
        debugLog(`Sending queued event: ${queuedEvent.event}`);
        socketRef.current.emit(queuedEvent.event, queuedEvent.data);
      });
    }
  }, [isConnected, debugLog]);

  const clearEventQueue = React.useCallback(() => {
    eventQueueRef.current = [];
    debugLog("Event queue cleared");
  }, [debugLog]);

  // --------------------------------------------------------------------------
  // Heartbeat Management
  // --------------------------------------------------------------------------

  const startHeartbeat = React.useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && isConnected && socketRef.current.connected) {
        socketRef.current.emit("heartbeat", {
          timestamp: Date.now(),
          connectionId: socketRef.current.id,
        });
        debugLog("Heartbeat sent");
      }
    }, mergedConfig.heartbeatInterval);
  }, [isConnected, mergedConfig.heartbeatInterval, debugLog]);

  const stopHeartbeat = React.useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  /**
   * Disconnect and fully tear down the socket instance.
   */
  const disconnect = React.useCallback(() => {
    debugLog("Disconnecting socket...");

    manualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionId(null);
    setConnectionError(null);
  }, [debugLog, stopHeartbeat]);

  /**
   * Initialize and connect the socket.
   *
   * IMPORTANT: This function will bail out early if no auth token is
   * found in storage, so the socket is never opened for unauthenticated users.
   */
  const initializeSocket = React.useCallback(async () => {
    // ── Auth guard ──────────────────────────────────────────────────────────
    const token = getStoredToken();
    if (!token) {
      debugLog("No auth token found — skipping socket connection");
      return;
    }

    // ── Prevent duplicate initialization ───────────────────────────────────
    if (socketRef.current && socketRef.current.connected) {
      debugLog("Socket already connected");
      return;
    }

    // ── Max-attempt guard ───────────────────────────────────────────────────
    if (connectionAttemptsRef.current >= mergedConfig.maxConnectionAttempts) {
      debugLog(
        `Max connection attempts (${mergedConfig.maxConnectionAttempts}) reached, stopping`,
      );
      setConnectionError(
        "Unable to connect to notification server after multiple attempts",
      );
      setIsConnecting(false);
      return;
    }

    // ── Check server reachability ──────────────────────────────────────────
    const reachable = await checkServerReachability(socketUrl);
    setServerReachable(reachable);

    if (!reachable) {
      debugLog("Server not reachable, delaying connection attempt");
      setConnectionError(
        "Server is not reachable. Please check if backend is running.",
      );
      setIsConnecting(false);

      // Retry after delay
      setTimeout(() => {
        if (mountedRef.current && getStoredToken()) {
          debugLog("Retrying server reachability check...");
          initializeSocket();
        }
      }, 5000);
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    connectionAttemptsRef.current++;
    manualDisconnectRef.current = false;

    debugLog(
      `Connection attempt ${connectionAttemptsRef.current}/${mergedConfig.maxConnectionAttempts}`,
    );

    try {
      const ioOptions = {
        ...DEFAULT_IO_OPTIONS,
        ...mergedConfig.options,
        auth: { token },
        // Add extra options for better reliability
        transports: ["websocket", "polling"],
        reconnectionAttempts: mergedConfig.maxConnectionAttempts,
      };

      debugLog("Initializing socket connection to:", socketUrl);
      const socketInstance = io(socketUrl, ioOptions);

      // ── Event handlers ────────────────────────────────────────────────────

      socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
        if (!mountedRef.current) return;
        debugLog("Socket connected successfully", { id: socketInstance.id });
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        setReconnectAttempts(0);
        setConnectionId(socketInstance.id || null);
        connectionAttemptsRef.current = 0;
        manualDisconnectRef.current = false;
        startHeartbeat();

        // Process any queued events after connection
        setTimeout(() => processEventQueue(), 100);

        onConnect?.();
      });

      socketInstance.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        if (!mountedRef.current) return;
        debugLog("Socket disconnected:", reason);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionId(null);
        stopHeartbeat();

        // Don't try to reconnect if manual disconnect
        if (!manualDisconnectRef.current && reason !== "io client disconnect") {
          debugLog("Unexpected disconnect, will attempt reconnect");
        }

        onDisconnect?.(reason);
      });

      socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        if (!mountedRef.current) return;
        debugLog("Socket connection error:", error.message);

        const errorMessage = `WebSocket connection failed: ${error.message || "Unknown error"}`;

        if (!mergedConfig.suppressErrors) {
          setConnectionError(errorMessage);
          onError?.(new Error(errorMessage));
        }

        setIsConnecting(false);
        console.warn("WebSocket connection failed:", error.message);
        lastErrorRef.current = error.message;
      });

      socketInstance.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (attempt) => {
        if (!mountedRef.current) return;
        debugLog("Reconnect attempt:", attempt);
        setReconnectAttempts(attempt);
        setIsConnecting(true);
        setConnectionError(null);
      });

      socketInstance.on(SOCKET_EVENTS.RECONNECT, (attempt) => {
        if (!mountedRef.current) return;
        debugLog("Reconnected successfully after", attempt, "attempts");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        setReconnectAttempts(0);
        connectionAttemptsRef.current = 0;
        startHeartbeat();
        processEventQueue();
      });

      socketInstance.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
        if (!mountedRef.current) return;
        debugLog("Reconnect error:", error);
        console.warn("Reconnection error:", error);
      });

      socketInstance.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
        if (!mountedRef.current) return;
        debugLog("Reconnect failed after all attempts");
        setIsConnecting(false);

        if (!mergedConfig.suppressErrors) {
          const finalError =
            "Unable to maintain connection to notification server";
          setConnectionError(finalError);
          onError?.(new Error(finalError));
        }
      });

      socketInstance.on(SOCKET_EVENTS.ERROR, (error) => {
        if (!mountedRef.current) return;
        debugLog("Socket error:", error);
        console.warn("Socket error:", error);
        onError?.(error);
      });

      socketInstance.on(SOCKET_EVENTS.PONG, (latency) => {
        debugLog(`Heartbeat pong received, latency: ${latency}ms`);
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Auto-connect if configured
      if (mergedConfig.autoConnect) {
        setTimeout(() => {
          if (
            socketRef.current &&
            mountedRef.current &&
            !manualDisconnectRef.current
          ) {
            debugLog("Connecting socket...");
            socketInstance.connect();
          }
        }, 100);
      }
    } catch (error) {
      debugLog("Failed to initialize socket:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Initialization failed";

      if (!mergedConfig.suppressErrors) {
        setConnectionError(errorMsg);
        onError?.(new Error(errorMsg));
      }

      setIsConnecting(false);
      console.warn("Socket initialization failed:", error);
      lastErrorRef.current = errorMsg;
    }
  }, [
    socketUrl,
    mergedConfig,
    debugLog,
    startHeartbeat,
    processEventQueue,
    stopHeartbeat,
    onConnect,
    onDisconnect,
    onError,
  ]);

  /**
   * Connect an already-created socket instance (or create one if absent).
   */
  const connect = React.useCallback(() => {
    debugLog("Manual connect requested");
    manualDisconnectRef.current = false;

    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    } else if (!socketRef.current) {
      connectionAttemptsRef.current = 0;
      initializeSocket();
    }
  }, [initializeSocket, debugLog]);

  /**
   * Tear down and re-initialise the connection.
   */
  const reconnect = React.useCallback(() => {
    debugLog("Manual reconnect requested");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    disconnect();

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connectionAttemptsRef.current = 0;
        manualDisconnectRef.current = false;
        initializeSocket();
      }
    }, 1000);
  }, [debugLog, disconnect, initializeSocket]);

  const resetConnectionAttempts = React.useCallback(() => {
    connectionAttemptsRef.current = 0;
    lastErrorRef.current = null;
    debugLog("Connection attempts reset");
  }, [debugLog]);

  // --------------------------------------------------------------------------
  // Event Emitters
  // --------------------------------------------------------------------------

  const emit = React.useCallback(
    (event, data, retry = true) => {
      if (socketRef.current && isConnected && socketRef.current.connected) {
        socketRef.current.emit(event, data);
        debugLog(`Event emitted: ${event}`);
        return true;
      }

      if (mergedConfig.queueOfflineEvents && retry) {
        queueEvent(event, data);
        debugLog(`Event queued (offline): ${event}`);
        return false;
      }

      debugLog(`Failed to emit event (offline): ${event}`);
      return false;
    },
    [isConnected, mergedConfig.queueOfflineEvents, queueEvent, debugLog],
  );

  const emitWithAck = React.useCallback(
    (event, data, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        if (
          !socketRef.current ||
          !isConnected ||
          !socketRef.current.connected
        ) {
          reject(new Error("Socket not connected"));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error(`Event ${event} timed out after ${timeout}ms`));
        }, timeout);

        socketRef.current.emit(event, data, (response) => {
          clearTimeout(timeoutId);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [isConnected],
  );

  const on = React.useCallback(
    (event, callback) => {
      if (!socketRef.current) {
        debugLog(`Cannot subscribe to ${event}: socket not initialized`);
        return () => {};
      }

      const handler = (data) => {
        debugLog(`Event received: ${event}`);
        callback(data);
      };

      socketRef.current.on(event, handler);

      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, handler);
          debugLog(`Unsubscribed from: ${event}`);
        }
      };
    },
    [debugLog],
  );

  const once = React.useCallback(
    (event, callback) => {
      if (!socketRef.current) return;

      socketRef.current.once(event, (data) => {
        debugLog(`Event received (once): ${event}`);
        callback(data);
      });
    },
    [debugLog],
  );

  const off = React.useCallback(
    (event, callback) => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
        debugLog(`Unsubscribed from: ${event}`);
      }
    },
    [debugLog],
  );

  const getConnectionStatus = React.useCallback(() => {
    return {
      isConnected,
      isConnecting,
      connectionError,
      reconnectAttempts,
      connectionId,
      hasError: !!connectionError,
      lastError: lastErrorRef.current,
      serverReachable,
      socketExists: !!socketRef.current,
      socketConnected: socketRef.current?.connected || false,
    };
  }, [
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    connectionId,
    serverReachable,
  ]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * Mount / unmount lifecycle.
   *
   * Only attempt to auto-connect if a token already exists in storage
   * (i.e. the user is already logged in when the app first loads).
   */
  React.useEffect(() => {
    mountedRef.current = true;

    const token = getStoredToken();

    if (mergedConfig.autoConnect && token) {
      // Small delay so the initial render isn't blocked
      const initTimeout = setTimeout(() => {
        if (mountedRef.current) {
          initializeSocket();
        }
      }, 500);

      return () => {
        clearTimeout(initTimeout);
        mountedRef.current = false;
        disconnect();
      };
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Listen for auth events dispatched by authService so the socket
   * connects on login and disconnects on logout automatically.
   */
  React.useEffect(() => {
    const handleLogin = () => {
      debugLog("auth:login event received — connecting socket");
      connectionAttemptsRef.current = 0;
      manualDisconnectRef.current = false;

      // Small delay to ensure the token has been written to storage first
      setTimeout(() => {
        if (mountedRef.current) {
          initializeSocket();
        }
      }, 200);
    };

    const handleLogout = () => {
      debugLog("auth:logout event received — disconnecting socket");
      manualDisconnectRef.current = true;
      connectionAttemptsRef.current = 0;
      disconnect();
    };

    window.addEventListener("auth:login", handleLogin);
    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:login", handleLogin);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [debugLog, initializeSocket, disconnect]);

  // Keep debugRef in sync with config changes
  React.useEffect(() => {
    debugRef.current = mergedConfig.enableDebug;
  }, [mergedConfig.enableDebug]);

  /**
   * Auto-reconnect on window focus — only when already authenticated.
   */
  React.useEffect(() => {
    const handleFocus = () => {
      const token = getStoredToken();
      if (
        !isConnected &&
        token &&
        mountedRef.current &&
        !manualDisconnectRef.current
      ) {
        debugLog("Window focused, attempting reconnect");
        reconnect();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isConnected, reconnect, debugLog]);

  /**
   * Online/Offline detection
   */
  React.useEffect(() => {
    const handleOnline = () => {
      debugLog("Browser reported online, attempting to reconnect socket");
      const token = getStoredToken();
      if (token && !isConnected && !manualDisconnectRef.current) {
        reconnect();
      }
    };

    const handleOffline = () => {
      debugLog("Browser reported offline");
      setConnectionError("Network connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isConnected, reconnect, debugLog]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // --------------------------------------------------------------------------
  // Context Value
  // --------------------------------------------------------------------------
  const contextValue = React.useMemo(
    () => ({
      // State
      socket,
      isConnected,
      isConnecting,
      connectionError,
      reconnectAttempts,
      connectionId,
      serverReachable,

      // Methods
      emit,
      emitWithAck,
      on,
      once,
      off,
      connect,
      disconnect,
      reconnect,

      // Utilities
      isOnline: isConnected,
      getSocketId: () => connectionId,
      clearQueue: clearEventQueue,
      resetConnectionAttempts,
      getConnectionStatus,
    }),
    [
      socket,
      isConnected,
      isConnecting,
      connectionError,
      reconnectAttempts,
      connectionId,
      serverReachable,
      emit,
      emitWithAck,
      on,
      once,
      off,
      connect,
      disconnect,
      reconnect,
      clearEventQueue,
      resetConnectionAttempts,
      getConnectionStatus,
    ],
  );

  return React.createElement(
    SocketContext.Provider,
    { value: contextValue },
    children,
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * useSocket — access the socket context.
 * Must be used inside <SocketProvider>.
 */
export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

/**
 * useSocketEvent — subscribe to a socket event with automatic cleanup.
 */
export const useSocketEvent = (event, handler, deps = []) => {
  const { on, off, isConnected } = useSocket();
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  React.useEffect(() => {
    if (!isConnected) return;

    const eventHandler = (data) => {
      handlerRef.current(data);
    };

    const unsubscribe = on(event, eventHandler);

    return () => {
      off(event, eventHandler);
      if (unsubscribe && typeof unsubscribe === "function") unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, on, off, isConnected, ...deps]);
};

/**
 * useSocketEmit — convenience hook for emit functions.
 */
export const useSocketEmit = () => {
  const { emit, emitWithAck } = useSocket();
  return { emit, emitWithAck };
};

/**
 * useSocketConnectionStatus — polled connection status.
 */
export const useSocketConnectionStatus = () => {
  const { getConnectionStatus } = useSocket();
  const [status, setStatus] = React.useState(getConnectionStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getConnectionStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, [getConnectionStatus]);

  return status;
};

export default SocketProvider;
