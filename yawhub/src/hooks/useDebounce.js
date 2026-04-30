// src/hooks/useDebounce.js - COMPLETELY FIXED VERSION
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for debouncing values.
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} [options.leading=false] - Execute on the leading edge of the timeout
 * @param {boolean} [options.trailing=true] - Execute on the trailing edge of the timeout
 * @param {number} [options.maxWait] - Maximum time the debounced function can be delayed
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @param {Function} [options.onChange] - Callback when debounced value changes
 * @param {boolean} [options.immediate=false] - Execute immediately on first call
 * @returns {Object} The debounced value with utility methods
 */
export function useDebounce(value, delay, options = {}) {
  const {
    leading = false,
    trailing = true,
    maxWait,
    debug = false,
    onChange,
    immediate = false,
  } = options;

  const debugRef = useRef(debug);
  const timeoutRef = useRef(null);
  const maxWaitTimeoutRef = useRef(null);
  const previousValueRef = useRef(value);
  const lastCallTimeRef = useRef(null);
  const lastInvokeTimeRef = useRef(0);
  const trailingValueRef = useRef(null);
  const isMountedRef = useRef(true);
  const isInvokingRef = useRef(false);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === "development") {
      console.log(
        "[useDebounce]",
        new Date().toISOString().slice(11, 23),
        ...args,
      );
    }
  }, []);

  if (typeof delay !== "number" || delay < 0 || isNaN(delay)) {
    console.warn("[useDebounce] Invalid delay value. Using default of 0ms.");
    delay = 0;
  }

  const validMaxWait =
    maxWait && typeof maxWait === "number" && !isNaN(maxWait) && maxWait > 0
      ? maxWait
      : null;

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      log("Cleared timeout");
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
      log("Cleared maxWait timeout");
    }
  }, [log]);

  const invokeUpdate = useCallback(
    (newValue, source = "timeout") => {
      if (!isMountedRef.current) {
        log("Component unmounted, skipping update");
        return false;
      }

      if (isInvokingRef.current) {
        log("Already invoking, skipping duplicate");
        return false;
      }

      isInvokingRef.current = true;
      log(`Updating debounced value (${source}):`, newValue);

      setDebouncedValue(newValue);

      if (onChange && typeof onChange === "function") {
        try {
          onChange(newValue, previousValueRef.current);
        } catch (error) {
          console.error("[useDebounce] onChange callback error:", error);
        }
      }

      previousValueRef.current = newValue;
      lastInvokeTimeRef.current = Date.now();
      clearTimeouts();
      isInvokingRef.current = false;

      return true;
    },
    [onChange, log, clearTimeouts],
  );

  const handleImmediate = useCallback(
    (currentValue) => {
      if (immediate && previousValueRef.current !== currentValue) {
        log("Immediate execution");
        invokeUpdate(currentValue, "immediate");
        return true;
      }
      return false;
    },
    [immediate, invokeUpdate, log],
  );

  useEffect(() => {
    const currentValue = value;
    const now = Date.now();

    if (handleImmediate(currentValue)) {
      lastCallTimeRef.current = now;
      return;
    }

    const isFirstCall = lastCallTimeRef.current === null;
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
    const shouldInvokeLeading = leading && isFirstCall;
    const shouldInvokeWithMaxWait =
      validMaxWait && timeSinceLastInvoke >= validMaxWait;

    log("Debounce check:", {
      currentValue,
      shouldInvokeLeading,
      shouldInvokeWithMaxWait,
      delay,
    });

    if (shouldInvokeLeading) {
      log("Invoking on leading edge");
      invokeUpdate(currentValue, "leading");
      clearTimeouts();
      lastCallTimeRef.current = now;
      return;
    }

    if (shouldInvokeWithMaxWait && trailing) {
      log("Invoking due to maxWait");
      invokeUpdate(currentValue, "maxWait");
      clearTimeouts();
      lastCallTimeRef.current = now;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (
      validMaxWait &&
      !maxWaitTimeoutRef.current &&
      !shouldInvokeWithMaxWait
    ) {
      const remainingMaxWait = validMaxWait - timeSinceLastInvoke;
      if (remainingMaxWait > 0) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (trailing) {
            log("MaxWait timeout triggered");
            invokeUpdate(currentValue, "maxWait");
          }
          clearTimeouts();
        }, remainingMaxWait);
        log(`MaxWait timeout set for ${remainingMaxWait}ms`);
      }
    }

    if (trailing) {
      trailingValueRef.current = currentValue;
    }

    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        const finalValue = trailingValueRef.current;
        if (
          finalValue !== undefined &&
          finalValue !== previousValueRef.current
        ) {
          log("Trailing timeout triggered");
          invokeUpdate(finalValue, "trailing");
        }
        clearTimeouts();
        trailingValueRef.current = null;
      }, delay);
      log(`Trailing timeout set for ${delay}ms`);
    }

    lastCallTimeRef.current = now;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current);
    };
  }, [
    value,
    delay,
    leading,
    trailing,
    validMaxWait,
    invokeUpdate,
    clearTimeouts,
    log,
    handleImmediate,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
      log("Component unmounted, cleaned up");
    };
  }, [clearTimeouts, log]);

  const flush = useCallback(() => {
    if (
      trailingValueRef.current !== null &&
      trailingValueRef.current !== previousValueRef.current
    ) {
      log("Manual flush called");
      invokeUpdate(trailingValueRef.current, "flush");
      clearTimeouts();
      trailingValueRef.current = null;
    }
  }, [invokeUpdate, clearTimeouts, log]);

  const cancel = useCallback(() => {
    log("Manual cancel called");
    clearTimeouts();
    trailingValueRef.current = null;
  }, [clearTimeouts, log]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null || maxWaitTimeoutRef.current !== null;
  }, []);

  const getValue = useCallback(() => debouncedValue, [debouncedValue]);

  const reset = useCallback(() => {
    log("Manual reset called");
    clearTimeouts();
    trailingValueRef.current = null;
    lastCallTimeRef.current = null;
    lastInvokeTimeRef.current = 0;
    setDebouncedValue(value);
    previousValueRef.current = value;
  }, [value, clearTimeouts, log]);

  return {
    value: debouncedValue,
    flush,
    cancel,
    isPending,
    getValue,
    reset,
  };
}

/**
 * Custom hook for debouncing function calls.
 */
export function useDebouncedCallback(fn, delay, options = {}) {
  const { leading = false, trailing = true, maxWait, debug = false } = options;

  const fnRef = useRef(fn);
  const debugRef = useRef(debug);
  const timeoutRef = useRef(null);
  const maxWaitTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(null);
  const lastInvokeTimeRef = useRef(0);
  const trailingArgsRef = useRef(null);
  const isMountedRef = useRef(true);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    debugRef.current = debug;
  }, [debug]);

  const log = useCallback((...args) => {
    if (debugRef.current && process.env.NODE_ENV === "development") {
      console.log(
        "[useDebouncedCallback]",
        new Date().toISOString().slice(11, 23),
        ...args,
      );
    }
  }, []);

  if (typeof delay !== "number" || delay < 0 || isNaN(delay)) {
    console.warn(
      "[useDebouncedCallback] Invalid delay value. Using default of 0ms.",
    );
    delay = 0;
  }

  const validMaxWait =
    maxWait && typeof maxWait === "number" && !isNaN(maxWait) && maxWait > 0
      ? maxWait
      : null;

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      log("Cleared timeout");
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
      log("Cleared maxWait timeout");
    }
  }, [log]);

  const execute = useCallback(
    (args, source = "timeout") => {
      if (!isMountedRef.current) {
        log("Component unmounted, skipping execution");
        return;
      }

      if (isExecutingRef.current) {
        log("Already executing, skipping");
        return;
      }

      isExecutingRef.current = true;
      log(`Executing function (${source}) with args:`, args);

      try {
        const result = fnRef.current(...args);
        lastInvokeTimeRef.current = Date.now();
        return result;
      } catch (error) {
        console.error(
          "[useDebouncedCallback] Function execution error:",
          error,
        );
        throw error;
      } finally {
        isExecutingRef.current = false;
      }
    },
    [log],
  );

  const debounced = useCallback(
    (...args) => {
      const now = Date.now();
      const isFirstCall = lastCallTimeRef.current === null;
      const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

      log("Debounced call:", { args, isFirstCall, timeSinceLastInvoke });

      if (leading && isFirstCall) {
        log("Executing on leading edge");
        clearTimeouts();
        lastCallTimeRef.current = now;
        return execute(args, "leading");
      }

      if (validMaxWait && timeSinceLastInvoke >= validMaxWait && trailing) {
        log("Executing due to maxWait");
        clearTimeouts();
        lastCallTimeRef.current = now;
        return execute(args, "maxWait");
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (validMaxWait && !maxWaitTimeoutRef.current) {
        const remainingMaxWait = validMaxWait - timeSinceLastInvoke;
        if (remainingMaxWait > 0) {
          maxWaitTimeoutRef.current = setTimeout(() => {
            if (trailing && trailingArgsRef.current) {
              log("MaxWait timeout executing");
              execute(trailingArgsRef.current, "maxWait");
            }
            clearTimeouts();
          }, remainingMaxWait);
          log(`MaxWait timeout set for ${remainingMaxWait}ms`);
        }
      }

      if (trailing) {
        trailingArgsRef.current = args;
      }

      timeoutRef.current = setTimeout(() => {
        if (trailing && trailingArgsRef.current) {
          log("Trailing timeout executing");
          execute(trailingArgsRef.current, "trailing");
        }
        clearTimeouts();
        trailingArgsRef.current = null;
      }, delay);

      log(`Trailing timeout set for ${delay}ms`);
      lastCallTimeRef.current = now;
    },
    [delay, leading, trailing, validMaxWait, execute, clearTimeouts, log],
  );

  const cancel = useCallback(() => {
    log("Manual cancel called");
    clearTimeouts();
    trailingArgsRef.current = null;
  }, [clearTimeouts, log]);

  const flush = useCallback(() => {
    if (timeoutRef.current && trailingArgsRef.current) {
      log("Manual flush called");
      execute(trailingArgsRef.current, "flush");
      clearTimeouts();
      trailingArgsRef.current = null;
    }
  }, [execute, clearTimeouts, log]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null || maxWaitTimeoutRef.current !== null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
      log("Component unmounted, cleaned up");
    };
  }, [clearTimeouts, log]);

  const enhancedDebounced = useCallback(
    (...args) => debounced(...args),
    [debounced],
  );
  enhancedDebounced.cancel = cancel;
  enhancedDebounced.flush = flush;
  enhancedDebounced.isPending = isPending;

  return enhancedDebounced;
}

/**
 * Custom hook for throttling values.
 */
export function useThrottle(value, limit, options = {}) {
  const { leading = true, trailing = true } = options;
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRunRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const trailingValueRef = useRef(null);

  useEffect(() => {
    if (!limit || limit <= 0) {
      setThrottledValue(value);
      return;
    }

    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit && leading) {
      setThrottledValue(value);
      lastRunRef.current = now;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (trailing) {
      trailingValueRef.current = value;
      if (!timeoutRef.current) {
        const remainingTime = limit - timeSinceLastRun;
        timeoutRef.current = setTimeout(() => {
          if (trailingValueRef.current !== null) {
            setThrottledValue(trailingValueRef.current);
            lastRunRef.current = Date.now();
            trailingValueRef.current = null;
          }
          timeoutRef.current = null;
        }, remainingTime);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, limit, leading, trailing]);

  return throttledValue;
}

/**
 * Custom hook for throttling function calls.
 */
export function useThrottledCallback(fn, limit, options = {}) {
  const { leading = true, trailing = true } = options;
  const fnRef = useRef(fn);
  const lastRunRef = useRef(0);
  const timeoutRef = useRef(null);
  const trailingArgsRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback((args) => {
    if (!isMountedRef.current) return;
    fnRef.current(...args);
    lastRunRef.current = Date.now();
  }, []);

  const throttled = useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= limit && leading) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          trailingArgsRef.current = null;
        }
        execute(args);
      } else if (trailing) {
        trailingArgsRef.current = args;
        if (!timeoutRef.current) {
          const remainingTime = limit - timeSinceLastRun;
          timeoutRef.current = setTimeout(
            () => {
              if (trailingArgsRef.current) {
                execute(trailingArgsRef.current);
                trailingArgsRef.current = null;
              }
              timeoutRef.current = null;
            },
            Math.max(0, remainingTime),
          );
        }
      }
    },
    [limit, leading, trailing, execute],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      trailingArgsRef.current = null;
    }
  }, []);

  throttled.cancel = cancel;
  return throttled;
}

// ONLY ONE DEFAULT EXPORT - NO DUPLICATES
export default useDebounce;
