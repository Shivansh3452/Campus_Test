import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export function useMemoizedValue(value, deps, label = '') {
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Memoized ${label} recalculated`);
    }
    return value;
  }, deps);
}

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function usePerformanceTracking(componentName) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`Slow render: ${componentName} took ${duration}ms`);
      }
    };
  }, [componentName]);
}