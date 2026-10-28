import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
export function useFormReset(node: RefObject<HTMLInputElement | null>, reset: () => void, form?: string) {
  const latest = useRef(reset); latest.current = reset;
  useEffect(() => {
    const owner = node.current?.form; let mounted = true;
    const handle = (event: Event) => queueMicrotask(() => { if (mounted && !event.defaultPrevented) latest.current(); });
    owner?.addEventListener('reset', handle);
    return () => { mounted = false; owner?.removeEventListener('reset', handle); };
  }, [node, form]);
}
