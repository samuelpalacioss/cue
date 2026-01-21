'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export type SearchParams = {
  duration?: number;
  layout?: 'month' | 'week' | 'day';
  month?: string; // YYYY-MM
  date?: string; // YYYY-MM-DD
  slot?: string; // ISO timestamp
};

export function useSearchQueryParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current search params into typed object
  const params: SearchParams = {
    duration: searchParams.get('duration')
      ? parseInt(searchParams.get('duration')!, 10)
      : undefined,
    layout: (searchParams.get('layout') as 'month' | 'week' | 'day') || undefined,
    month: searchParams.get('month') || undefined,
    date: searchParams.get('date') || undefined,
    slot: searchParams.get('slot') || undefined,
  };

  // Set a single parameter
  function setParam<K extends keyof SearchParams>(
    key: K,
    value: SearchParams[K] | undefined
  ) {
    const newParams = new URLSearchParams(searchParams.toString());

    if (value === undefined || value === null) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }

    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }

  // Set multiple parameters at once
  function setParams(newParams: Partial<SearchParams>) {
    const updatedParams = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        updatedParams.delete(key);
      } else {
        updatedParams.set(key, String(value));
      }
    });

    router.push(`${pathname}?${updatedParams.toString()}`, { scroll: false });
  }

  return {
    params,
    setParam,
    setParams,
  };
}
