// src/utils/socket.js

import { io } from 'socket.io-client';

// ==============================
// Configuration
// ==============================

const SOCKET_CONFIG = {
  // Default configuration
  url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    withCredentials: true,
  },
};

// ==============================
// Socket Events
// ==============================

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // Application events
  ERROR: 'error',
  MESSAGE: 'message',
  NOTIFICATION: 'notification',
  
  // Authentication events
  AUTH_SUCCESS: 'auth_success',
  AUTH_ERROR: 'auth_error',
  TOKEN_EXPIRED: 'token_expired',
  
  // Custom events (add your own)
  // USER_JOINED: 'user_joined',
  // USER_LEFT: 'user_left',
  // CHAT_MESSAGE: 'chat_message',
  // TYPING: 'typing',
  // etc.
};

// ==============================
// Socket Manager Class
// ==============================

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.eventListeners = new Map();
    this.pendingEvents = [];
    this.connectionPromise = null;
    this.token = null;
    this.config = { ...SOCKET_CONFIG };
  }

  /**
   * Initialize socket connection
   * @param {string} token - Authentication token
   * @param {Object} options - Socket configuration options
   * @returns {Promise} Promise that resolves when connected
   */
  initialize(token, options = {}) {
    if (this.socket) {
      console.warn('[Socket] Already initialized, disconnecting first...');
      this.disconnect();
    }

    this.token = token;
    this.config.options = {
      ...this.config.options,
      ...options,
      auth: { token },
    };

    this.socket = io(this.config.url, this.config.options);
    this._setupEventHandlers();
    
    // Return connection promise for async initialization
    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket.once(SOCKET_EVENTS.CONNECT, () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._flushPendingEvents();
        resolve(this.socket);
      });
      
      this.socket.once(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        reject(error);
      });
    });
    
    this.socket.connect();
    
    return this.connectionPromise;
  }

  /**
   * Setup socket event handlers
   */
  _setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[Socket] Connected successfully');
      this.isConnected = true;
      this._emitEvent('connection:established', { timestamp: new Date().toISOString() });
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected = false;
      this._emitEvent('connection:lost', { reason, timestamp: new Date().toISOString() });
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('[Socket] Connection error:', error);
      this._emitEvent('connection:error', { error: error.message });
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`[Socket] Reconnection attempt ${attempt}`);
      this._emitEvent('reconnection:attempt', { attempt });
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT, (attempt) => {
      console.log(`[Socket] Reconnected after ${attempt} attempts`);
      this.isConnected = true;
      this._emitEvent('reconnection:success', { attempt });
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
      console.error('[Socket] Reconnection error:', error);
      this._emitEvent('reconnection:error', { error: error.message });
    });

    this.socket.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
      console.error('[Socket] Reconnection failed after max attempts');
      this._emitEvent('reconnection:failed', { maxAttempts: this.config.options.reconnectionAttempts });
    });

    // Authentication events
    this.socket.on(SOCKET_EVENTS.AUTH_SUCCESS, (data) => {
      console.log('[Socket] Authentication successful');
      this._emitEvent('auth:success', data);
    });

    this.socket.on(SOCKET_EVENTS.AUTH_ERROR, (error) => {
      console.error('[Socket] Authentication error:', error);
      this._emitEvent('auth:error', error);
    });

    this.socket.on(SOCKET_EVENTS.TOKEN_EXPIRED, () => {
      console.warn('[Socket] Token expired');
      this._emitEvent('token:expired');
    });

    // Error handling
    this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('[Socket] Error:', error);
      this._emitEvent('error', error);
    });
  }

  /**
   * Emit internal event to registered listeners
   */
  _emitEvent(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Flush pending events after reconnection
   */
  _flushPendingEvents() {
    if (this.pendingEvents.length > 0) {
      console.log(`[Socket] Flushing ${this.pendingEvents.length} pending events`);
      this.pendingEvents.forEach(({ event, data }) => {
        this.emit(event, data);
      });
      this.pendingEvents = [];
    }
  }

  /**
   * Get socket instance
   * @returns {Object} Socket instance
   */
  getSocket() {
    if (!this.socket) {
      throw new Error('[Socket] Socket not initialized. Call initialize() first.');
    }
    return this.socket;
  }

  /**
   * Check if socket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.isConnected && this.socket?.connected;
  }

  /**
   * Emit event with retry mechanism
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @param {Object} options - Emit options
   * @returns {Promise} Promise that resolves when event is sent
   */
  emit(event, data, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('[Socket] Socket not initialized'));
        return;
      }

      const { retryOnDisconnect = true, timeout = 5000 } = options;

      if (!this.isConnected() && retryOnDisconnect) {
        console.log(`[Socket] Not connected, queueing event: ${event}`);
        this.pendingEvents.push({ event, data });
        resolve({ queued: true, event });
        return;
      }

      if (!this.isConnected()) {
        reject(new Error('[Socket] Not connected'));
        return;
      }

      // Set timeout for event emission
      const timeoutId = setTimeout(() => {
        reject(new Error(`[Socket] Event emission timeout: ${event}`));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        
        if (response?.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Listen to event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.socket) {
      throw new Error('[Socket] Socket not initialized');
    }

    // Add to internal listeners for internal events
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    // Add socket listener
    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.socket) return;

    // Remove from internal listeners
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }

    // Remove socket listener
    this.socket.off(event, callback);
  }

  /**
   * Listen to event once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    if (!this.socket) {
      throw new Error('[Socket] Socket not initialized');
    }

    this.socket.once(event, callback);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      console.log('[Socket] Disconnecting...');
      
      // Remove all listeners
      this.eventListeners.clear();
      
      // Disconnect socket
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.pendingEvents = [];
      this.connectionPromise = null;
    }
  }

  /**
   * Reconnect socket
   * @returns {Promise} Promise that resolves when reconnected
   */
  reconnect() {
    if (!this.socket) {
      throw new Error('[Socket] Socket not initialized');
    }

    console.log('[Socket] Attempting to reconnect...');
    this.socket.connect();
    
    return new Promise((resolve) => {
      this.socket.once(SOCKET_EVENTS.CONNECT, () => {
        resolve();
      });
    });
  }

  /**
   * Update authentication token
   * @param {string} token - New authentication token
   */
  updateToken(token) {
    this.token = token;
    if (this.socket) {
      this.socket.auth = { token };
      if (this.isConnected()) {
        // Re-authenticate if connected
        this.emit('authenticate', { token });
      }
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status object
   */
  getStatus() {
    return {
      isConnected: this.isConnected(),
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      pendingEvents: this.pendingEvents.length,
      transport: this.socket?.io?.engine?.transport?.name || null,
    };
  }
}

// ==============================
// Singleton Instance
// ==============================

const socketManager = new SocketManager();

// ==============================
// Public API
// ==============================

/**
 * Initialize socket connection
 * @param {string} token - Authentication token
 * @param {Object} options - Socket configuration options
 * @returns {Promise} Promise that resolves when connected
 */
export const initializeSocket = (token, options = {}) => {
  return socketManager.initialize(token, options);
};

/**
 * Get socket instance
 * @returns {Object} Socket instance
 */
export const getSocket = () => {
  return socketManager.getSocket();
};

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return socketManager.isConnected();
};

/**
 * Emit event
 * @param {string} event - Event name
 * @param {any} data - Event data
 * @param {Object} options - Emit options
 * @returns {Promise} Promise that resolves when event is sent
 */
export const emitEvent = (event, data, options = {}) => {
  return socketManager.emit(event, data, options);
};

/**
 * Listen to event
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onEvent = (event, callback) => {
  return socketManager.on(event, callback);
};

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export const offEvent = (event, callback) => {
  socketManager.off(event, callback);
};

/**
 * Listen to event once
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export const onceEvent = (event, callback) => {
  socketManager.once(event, callback);
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  socketManager.disconnect();
};

/**
 * Reconnect socket
 * @returns {Promise} Promise that resolves when reconnected
 */
export const reconnectSocket = () => {
  return socketManager.reconnect();
};

/**
 * Update authentication token
 * @param {string} token - New authentication token
 */
export const updateSocketToken = (token) => {
  socketManager.updateToken(token);
};

/**
 * Get connection status
 * @returns {Object} Connection status object
 */
export const getSocketStatus = () => {
  return socketManager.getStatus();
};

// ==============================
// React Hook
// ==============================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * React hook for using socket
 * @param {string} event - Event to listen to
 * @param {Function} handler - Event handler
 * @returns {Object} Socket utilities
 */
export const useSocket = (event, handler) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState({});
  const handlerRef = useRef(handler);

  // Update handler ref
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Setup socket listeners
  useEffect(() => {
    // Update connection status
    const updateConnectionStatus = () => {
      setIsConnected(socketManager.isConnected());
      setStatus(socketManager.getStatus());
    };

    // Listen to connection events
    const unsubscribeConnect = onEvent(SOCKET_EVENTS.CONNECT, updateConnectionStatus);
    const unsubscribeDisconnect = onEvent(SOCKET_EVENTS.DISCONNECT, updateConnectionStatus);
    
    // Initial status
    updateConnectionStatus();

    // Listen to specific event if provided
    let unsubscribeEvent;
    if (event && handlerRef.current) {
      unsubscribeEvent = onEvent(event, (data) => {
        handlerRef.current(data);
      });
    }

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      if (unsubscribeEvent) unsubscribeEvent();
    };
  }, [event]);

  // Return socket utilities
  return {
    socket: socketManager.getSocket(),
    isConnected,
    status,
    emit: useCallback((eventName, data, options) => emitEvent(eventName, data, options), []),
    on: useCallback((eventName, cb) => onEvent(eventName, cb), []),
    off: useCallback((eventName, cb) => offEvent(eventName, cb), []),
  };
};

// ==============================
// Export Socket Manager for advanced use
// ==============================

export default socketManager;