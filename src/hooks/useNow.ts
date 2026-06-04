"use client";

import { useEffect, useState } from 'react';

/** Returns the current Date, refreshed every `intervalMs` (default 60s). */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
