'use client';

import * as React from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *
 * Used to keep a fast typist from firing one network request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
