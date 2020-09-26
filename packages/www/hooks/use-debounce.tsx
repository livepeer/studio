import { useState, useEffect } from "react";

export default function useDebounce<T>(
  value: T,
  delay: number,
  onChange?: (v: T) => void
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange && value != debouncedValue) {
        onChange(value);
      }
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return debouncedValue;
}
