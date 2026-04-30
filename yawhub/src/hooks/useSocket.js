import { useContext, useMemo, useDebugValue, useCallback, useRef, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';

/**
 * Custom hook to access Socket.io context with full error handling and debugging support.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} [options.throwOnError=true] - Whether to throw error when used outside provider
 * @param {string} [options.errorMessage] - Custom error message
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {Object} Socket context value
 * @throws {Error} When used outside SocketProvider and throwOnError is true
 * 
 * @example
 * // Basic usage
 * const { socket, isConnected } = useSocket();
 * 
 * @example
 * // With error handling
 * const socketContext = useSocket({ throwOnError: false });
 * if (socketContext) {
 *   socketContext.emit('message', data);
 * }
 * 
 * @example
 * // With debug logging
 * const { socket, isConnected } = useSocket({ debug: true });
 */
export const useSocket = (options = {}) => {
  const {
    throwOnError = true,
    errorMessage = 'useSocket must be used within a SocketProvider',
    debug = false
  } = options;

  // Store debug flag in ref to avoid re-renders
  const debugRef = useRef(debug);
  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const context = useContext(SocketContext);

  // Debug logging utility
  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === 'development') {
      console.log('[useSocket]', ...args);
    }
  }, []);

  // Add React DevTools debug label
  useDebugValue(context?.isConnected ? '[Connected]' : '[Disconnected]');

  // Handle missing context
  if (context === undefined) {
    const errorDetails = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    };

    if (throwOnError) {
      const enhancedError = new Error(
        process.env.NODE_ENV === 'development'
          ? `${errorMessage}\n\nTroubleshooting:\n` +
            `1. Ensure <SocketProvider> is mounted at the root of your app\n` +
            `2. Verify you're not calling useSocket before the provider is initialized\n` +
            `3. Check that your component is within the provider's component tree\n` +
            `4. Confirm SocketContext is properly exported from '../context/SocketContext'\n\n` +
            `Error details: ${JSON.stringify(errorDetails, null, 2)}`
          : errorMessage
      );

      if (process.env.NODE_ENV === 'development') {
        console.error('[useSocket] [ERROR] Context not found:', errorDetails);
      }

      throw enhancedError;
    }

    log('Context not found, returning null');
    return null;
  }

  // Validate context structure in development
  if (process.env.NODE_ENV === 'development') {
    if (!context.socket && !context.isConnected) {
      console.warn(
        '[useSocket] [WARNING] Socket context is initialized but socket instance is missing. ' +
        'This might indicate an issue with your SocketProvider implementation.\n' +
        'Expected context structure: { socket: Socket | null, isConnected: boolean, ... }'
      );
    }

    // Warn if context is missing common methods
    const expectedMethods = ['emit', 'on', 'off', 'disconnect'];
    const missingMethods = expectedMethods.filter(method => 
      context.socket && typeof context.socket[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      console.warn(
        `[useSocket] [WARNING] Socket instance is missing expected methods: ${missingMethods.join(', ')}. ` +
        'This may cause runtime errors when using socket methods.'
      );
    }
  }

  // Create memoized wrapper functions for common socket operations
  const emit = useCallback((event, data, callback) => {
    if (!context.socket) {
      log('Cannot emit event - socket not connected:', event);
      return false;
    }
    
    if (!context.isConnected) {
      log('Warning: Emitting event while socket is not connected:', event);
    }
    
    log('Emitting event:', event, data);
    return context.socket.emit(event, data, callback);
  }, [context.socket, context.isConnected, log]);

  const on = useCallback((event, handler) => {
    if (!context.socket) {
      log('Cannot add listener - socket not connected:', event);
      return () => {};
    }
    
    log('Adding listener for event:', event);
    context.socket.on(event, handler);
    
    // Return cleanup function
    return () => {
      log('Removing listener for event:', event);
      context.socket.off(event, handler);
    };
  }, [context.socket, log]);

  const off = useCallback((event, handler) => {
    if (!context.socket) {
      log('Cannot remove listener - socket not connected:', event);
      return;
    }
    
    log('Removing listener for event:', event);
    context.socket.off(event, handler);
  }, [context.socket, log]);

  const once = useCallback((event, handler) => {
    if (!context.socket) {
      log('Cannot add one-time listener - socket not connected:', event);
      return () => {};
    }
    
    log('Adding one-time listener for event:', event);
    context.socket.once(event, handler);
    
    return () => {
      context.socket.off(event, handler);
    };
  }, [context.socket, log]);

  // Create enhanced context with utility methods
  const enhancedContext = useMemo(() => ({
    ...context,
    // Enhanced methods with error handling
    emit,
    on,
    off,
    once,
    // Helper methods
    isReady: context.isConnected && !!context.socket,
    // Connection status with details
    connectionStatus: {
      isConnected: context.isConnected,
      socketId: context.socket?.id || null,
      transport: context.socket?.io?.engine?.transport?.name || null,
    }
  }), [context, emit, on, off, once]);

  // Memoize the final return value
  const returnValue = useMemo(() => enhancedContext, [enhancedContext]);

  log('Hook initialized, connection status:', returnValue.connectionStatus);

  return returnValue;
};

// Add a display name for better debugging
useSocket.displayName = 'useSocket';

// Export a default for convenience
export default useSocket;