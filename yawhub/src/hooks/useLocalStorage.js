import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing state synchronized with localStorage.
 * 
 * @param {string} key - The localStorage key to store the value under
 * @param {*} initialValue - Initial value if no value exists in localStorage
 * @param {Object} options - Configuration options
 * @param {boolean} [options.serialize=true] - Whether to serialize/deserialize values
 * @param {Function} [options.serializer=JSON.stringify] - Custom serializer function
 * @param {Function} [options.deserializer=JSON.parse] - Custom deserializer function
 * @param {boolean} [options.syncAcrossTabs=true] - Sync changes across tabs/windows
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {[*, Function, Function]} Returns [storedValue, setValue, removeValue] tuple
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = true,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    syncAcrossTabs = true,
    debug = false
  } = options;

  const debugRef = useRef(debug);
  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === 'development') {
      console.log(`[useLocalStorage:${key}]`, ...args);
    }
  }, [key]);

  if (!key || typeof key !== 'string') {
    throw new Error('[useLocalStorage] Key must be a non-empty string');
  }

  const isBrowser = typeof window !== 'undefined';

  const readValue = useCallback(() => {
    if (!isBrowser) {
      log('Browser not available, returning initial value');
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        log('No existing value found, using initial value');
        return initialValue;
      }

      if (!serialize) {
        log('Returning raw value without deserialization');
        return item;
      }

      const parsed = deserializer(item);
      log('Successfully read value from localStorage:', parsed);
      return parsed;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading localStorage key "${key}":`, error);
      log('Error reading value, falling back to initial value:', error);
      return initialValue;
    }
  }, [key, initialValue, serialize, deserializer, isBrowser, log]);

  const [storedValue, setStoredValue] = useState(readValue);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (isBrowser) {
        let valueToSerialize = valueToStore;
        
        if (serialize) {
          try {
            valueToSerialize = serializer(valueToStore);
          } catch (serializeError) {
            console.error(`[useLocalStorage] Error serializing value for key "${key}":`, serializeError);
            throw serializeError;
          }
        }
        
        window.localStorage.setItem(key, valueToSerialize);
        log('Successfully saved value to localStorage:', valueToStore);
        
        if (syncAcrossTabs) {
          window.dispatchEvent(new CustomEvent('local-storage', {
            detail: {
              key,
              oldValue: storedValue,
              newValue: valueToStore,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error setting localStorage key "${key}":`, error);
      log('Error setting value:', error);
      throw error;
    }
  }, [key, storedValue, serialize, serializer, isBrowser, syncAcrossTabs, log]);

  const removeValue = useCallback(() => {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
        log('Successfully removed value from localStorage');
        
        if (syncAcrossTabs) {
          window.dispatchEvent(new CustomEvent('local-storage-remove', {
            detail: {
              key,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error removing localStorage key "${key}":`, error);
      log('Error removing value:', error);
    }
  }, [key, initialValue, isBrowser, syncAcrossTabs, log]);

  useEffect(() => {
    if (!syncAcrossTabs || !isBrowser) return;

    const handleStorageChange = (event) => {
      if (event.key === key) {
        log('Storage event detected from another tab:', event);
        
        if (event.newValue === null) {
          setStoredValue(initialValue);
        } else {
          try {
            const newValue = serialize ? deserializer(event.newValue) : event.newValue;
            setStoredValue(newValue);
          } catch (error) {
            console.error(`[useLocalStorage] Error handling storage event for key "${key}":`, error);
          }
        }
      }
    };

    const handleCustomStorageEvent = (event) => {
      if (event.detail.key === key) {
        log('Custom storage event detected:', event.detail);
        setStoredValue(event.detail.newValue);
      }
    };

    const handleCustomRemoveEvent = (event) => {
      if (event.detail.key === key) {
        log('Custom remove event detected:', event.detail);
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleCustomStorageEvent);
    window.addEventListener('local-storage-remove', handleCustomRemoveEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleCustomStorageEvent);
      window.removeEventListener('local-storage-remove', handleCustomRemoveEvent);
    };
  }, [key, initialValue, serialize, deserializer, syncAcrossTabs, isBrowser, log]);

  useEffect(() => {
    const newValue = readValue();
    if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
      log('Key changed, updating stored value:', newValue);
      setStoredValue(newValue);
    }
  }, [key, readValue, storedValue, log]);

  useEffect(() => {
    const handleQuotaExceeded = (error) => {
      if (error.name === 'QuotaExceededError') {
        console.warn(
          `[useLocalStorage] localStorage quota exceeded for key "${key}". ` +
          'Consider clearing old data or using a different storage strategy.'
        );
      }
    };

    window.addEventListener('error', handleQuotaExceeded);
    return () => window.removeEventListener('error', handleQuotaExceeded);
  }, [key, storedValue]);

  return [storedValue, setValue, removeValue];
};

useLocalStorage.displayName = 'useLocalStorage';
export default useLocalStorage;