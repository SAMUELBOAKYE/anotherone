// src/utils/storage.js

/**
 * Storage Utility
 * Provides a unified interface for browser storage with enhanced features
 * @version 2.0.0
 */

// ==============================
// Storage Types
// ==============================

export const StorageType = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  MEMORY: 'memory', // Fallback when storage is unavailable
};

// ==============================
// Storage Errors
// ==============================

class StorageError extends Error {
  constructor(message, operation, key, originalError) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
    this.originalError = originalError;
  }
}

// ==============================
// Memory Storage (Fallback)
// ==============================

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  get length() {
    return this.store.size;
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

// ==============================
// Storage Wrapper Class
// ==============================

class StorageWrapper {
  constructor(type = StorageType.LOCAL, prefix = 'app_') {
    this.type = type;
    this.prefix = prefix;
    this.storage = this._initStorage(type);
    this.memoryFallback = new MemoryStorage();
    this._isAvailable = this._checkAvailability();
  }

  /**
   * Initialize storage based on type
   */
  _initStorage(type) {
    try {
      switch (type) {
        case StorageType.SESSION:
          return window.sessionStorage;
        case StorageType.MEMORY:
          return new MemoryStorage();
        default:
          return window.localStorage;
      }
    } catch (error) {
      console.warn(`Failed to initialize ${type}, using memory fallback:`, error);
      return new MemoryStorage();
    }
  }

  /**
   * Check if storage is available
   */
  _checkAvailability() {
    if (this.type === StorageType.MEMORY) return true;
    
    try {
      const testKey = `${this.prefix}test`;
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn(`${this.type} is not available:`, error);
      return false;
    }
  }

  /**
   * Get prefixed key
   */
  _getPrefixedKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Handle storage operations with error handling
   */
  _handleOperation(operation, key, value = null, defaultValue = null) {
    try {
      if (!this._isAvailable && this.type !== StorageType.MEMORY) {
        console.warn(`${this.type} unavailable, using memory fallback`);
        return this._handleWithFallback(operation, key, value, defaultValue);
      }

      const prefixedKey = this._getPrefixedKey(key);
      const storage = this.storage;

      switch (operation) {
        case 'set':
          storage.setItem(prefixedKey, JSON.stringify(value));
          return { success: true, data: value };
        
        case 'get':
          const item = storage.getItem(prefixedKey);
          const parsed = item ? JSON.parse(item) : defaultValue;
          return { success: true, data: parsed };
        
        case 'remove':
          storage.removeItem(prefixedKey);
          return { success: true, data: null };
        
        case 'clear':
          // Only clear items with our prefix
          const keysToRemove = [];
          for (let i = 0; i < storage.length; i++) {
            const storageKey = storage.key(i);
            if (storageKey?.startsWith(this.prefix)) {
              keysToRemove.push(storageKey);
            }
          }
          keysToRemove.forEach(k => storage.removeItem(k));
          return { success: true, data: null };
        
        case 'has':
          return { 
            success: true, 
            data: storage.getItem(prefixedKey) !== null 
          };
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Storage error during ${operation}:`, error);
      
      // Attempt fallback if primary storage fails
      if (this.type !== StorageType.MEMORY) {
        return this._handleWithFallback(operation, key, value, defaultValue);
      }
      
      return { 
        success: false, 
        data: defaultValue,
        error: new StorageError(error.message, operation, key, error)
      };
    }
  }

  /**
   * Handle operation with fallback storage
   */
  _handleWithFallback(operation, key, value, defaultValue) {
    const fallbackStorage = this.memoryFallback;
    const prefixedKey = this._getPrefixedKey(key);
    
    try {
      switch (operation) {
        case 'set':
          fallbackStorage.setItem(prefixedKey, JSON.stringify(value));
          return { success: true, data: value, fallback: true };
        
        case 'get':
          const item = fallbackStorage.getItem(prefixedKey);
          const parsed = item ? JSON.parse(item) : defaultValue;
          return { success: true, data: parsed, fallback: true };
        
        case 'remove':
          fallbackStorage.removeItem(prefixedKey);
          return { success: true, data: null, fallback: true };
        
        case 'clear':
          // Clear only prefixed items from fallback
          const keysToRemove = [];
          for (let i = 0; i < fallbackStorage.length; i++) {
            const storageKey = fallbackStorage.key(i);
            if (storageKey?.startsWith(this.prefix)) {
              keysToRemove.push(storageKey);
            }
          }
          keysToRemove.forEach(k => fallbackStorage.removeItem(k));
          return { success: true, data: null, fallback: true };
        
        case 'has':
          return { 
            success: true, 
            data: fallbackStorage.getItem(prefixedKey) !== null,
            fallback: true 
          };
        
        default:
          return { success: false, data: defaultValue, fallback: true };
      }
    } catch (error) {
      return { success: false, data: defaultValue, error };
    }
  }

  // ==============================
  // Public API Methods
  // ==============================

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    const result = this._handleOperation('set', key, value);
    return result.success;
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Stored value or defaultValue
   */
  get(key, defaultValue = null) {
    const result = this._handleOperation('get', key, null, defaultValue);
    return result.data;
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    const result = this._handleOperation('remove', key);
    return result.success;
  }

  /**
   * Clear all items with prefix from storage
   * @returns {boolean} Success status
   */
  clear() {
    const result = this._handleOperation('clear');
    return result.success;
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  has(key) {
    const result = this._handleOperation('has', key);
    return result.data;
  }

  /**
   * Get all keys with prefix
   * @returns {Array<string>} Array of keys
   */
  keys() {
    try {
      const storage = this.storage;
      const keys = [];
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  /**
   * Get all items with prefix
   * @returns {Object} Object containing all stored items
   */
  getAll() {
    const items = {};
    const keys = this.keys();
    
    for (const key of keys) {
      items[key] = this.get(key);
    }
    
    return items;
  }

  /**
   * Set multiple items at once
   * @param {Object} items - Object with key-value pairs
   * @returns {boolean} Success status
   */
  setMultiple(items) {
    try {
      for (const [key, value] of Object.entries(items)) {
        this.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Error setting multiple items:', error);
      return false;
    }
  }

  /**
   * Get multiple items at once
   * @param {Array<string>} keys - Array of keys to get
   * @returns {Object} Object with retrieved items
   */
  getMultiple(keys) {
    const result = {};
    
    for (const key of keys) {
      result[key] = this.get(key);
    }
    
    return result;
  }

  /**
   * Remove multiple items
   * @param {Array<string>} keys - Array of keys to remove
   * @returns {boolean} Success status
   */
  removeMultiple(keys) {
    try {
      for (const key of keys) {
        this.remove(key);
      }
      return true;
    } catch (error) {
      console.error('Error removing multiple items:', error);
      return false;
    }
  }

  /**
   * Set item with expiry time
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} Success status
   */
  setWithExpiry(key, value, ttl) {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    return this.set(key, item);
  }

  /**
   * Get item with expiry check
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found or expired
   * @returns {any} Stored value or defaultValue
   */
  getWithExpiry(key, defaultValue = null) {
    const item = this.get(key);
    
    if (!item) return defaultValue;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.remove(key);
      return defaultValue;
    }
    
    return item.value;
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage statistics
   */
  getStorageInfo() {
    try {
      let totalSize = 0;
      const items = [];
      const keys = this.keys();
      
      for (const key of keys) {
        const value = this.get(key);
        const valueString = JSON.stringify(value);
        const size = new Blob([valueString]).size;
        totalSize += size;
        
        items.push({
          key,
          size,
          value: valueString.length > 100 ? `${valueString.substring(0, 100)}...` : valueString,
        });
      }
      
      return {
        type: this.type,
        available: this._isAvailable,
        itemCount: keys.length,
        totalSize: totalSize,
        totalSizeFormatted: this._formatBytes(totalSize),
        items,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  /**
   * Format bytes to human readable format
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// ==============================
// Create default storage instances
// ==============================

// Default localStorage instance
export const storage = new StorageWrapper(StorageType.LOCAL, 'app_');

// Session storage instance
export const sessionStorage = new StorageWrapper(StorageType.SESSION, 'app_');

// Memory storage instance (for testing or fallback)
export const memoryStorage = new StorageWrapper(StorageType.MEMORY, 'app_');

// ==============================
// Convenience Methods
// ==============================

/**
 * Clear all app data (both local and session storage)
 */
export const clearAllAppData = () => {
  storage.clear();
  sessionStorage.clear();
};

/**
 * Migrate data from one storage to another
 * @param {StorageWrapper} source - Source storage
 * @param {StorageWrapper} destination - Destination storage
 * @param {Array<string>} keys - Specific keys to migrate (optional)
 */
export const migrateData = (source, destination, keys = null) => {
  const dataToMigrate = keys ? source.getMultiple(keys) : source.getAll();
  destination.setMultiple(dataToMigrate);
  
  if (keys) {
    source.removeMultiple(keys);
  } else {
    source.clear();
  }
};

/**
 * Export storage data as JSON
 * @returns {string} JSON string of all stored data
 */
export const exportStorageData = () => {
  const data = {
    local: storage.getAll(),
    session: sessionStorage.getAll(),
    exportDate: new Date().toISOString(),
    version: '1.0.0',
  };
  
  return JSON.stringify(data, null, 2);
};

/**
 * Import storage data from JSON
 * @param {string} jsonData - JSON string to import
 * @param {boolean} merge - Whether to merge with existing data
 */
export const importStorageData = (jsonData, merge = false) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!merge) {
      storage.clear();
      sessionStorage.clear();
    }
    
    if (data.local) {
      storage.setMultiple(data.local);
    }
    
    if (data.session) {
      sessionStorage.setMultiple(data.session);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing storage data:', error);
    return false;
  }
};

// ==============================
// Event Listeners for Storage Changes
// ==============================

/**
 * Listen for storage changes across tabs
 * @param {Function} callback - Callback function
 * @returns {Function} Cleanup function
 */
export const onStorageChange = (callback) => {
  const handler = (event) => {
    if (event.storageArea === localStorage || event.storageArea === sessionStorage) {
      callback({
        key: event.key?.replace(/^app_/, ''),
        oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
        newValue: event.newValue ? JSON.parse(event.newValue) : null,
        url: event.url,
        storageArea: event.storageArea,
      });
    }
  };
  
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener('storage', handler);
  };
};

// ==============================
// Export all utilities
// ==============================

export default storage;