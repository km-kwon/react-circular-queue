import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BufferManager, createBuffer } from "../core/BufferManager";

/**
 * Options for the useCircularBuffer hook
 *
 * @template T - Element type stored in the buffer
 */
export interface UseCircularBufferOptions<T> {
  /**
   * Initial items to populate the buffer (applied once on mount).
   * If overflow happens, it follows BufferManager.pushTail behavior
   * (i.e., keeps the last `capacity` items).
   */
  initialItems?: readonly T[];
}

/**
 * Overloaded pop function signature
 */
export interface PopFn<T> {
  (): T | undefined;
  (count: number): T[];
}

/**
 * Return type for useCircularBuffer hook
 */
export interface UseCircularBufferReturn<T> {
  /** Current items in the buffer (oldest -> newest) */
  data: T[];

  /** Add a single item or array to the head (front) */
  pushHead: (input: T | readonly T[]) => void;

  /** Add a single item or array to the tail (back) */
  pushTail: (input: T | readonly T[]) => void;

  /** Remove and return item(s) from head (oldest) */
  popHead: PopFn<T>;

  /** Remove and return item(s) from tail (newest) */
  popTail: PopFn<T>;

  /** Peek head (oldest) item (non-destructive) */
  getHead: () => T | undefined;

  /** Peek tail (newest) item (non-destructive) */
  getTail: () => T | undefined;

  /** Clear all items from the buffer */
  clear: () => void;

  /** Replace all items with new ones */
  replaceAll: (items: readonly T[]) => void;

  /** Resize the buffer capacity (logical capacity) */
  resize: (newCapacity: number) => void;

  /** Current number of items in the buffer */
  size: number;

  /** Maximum logical capacity of the buffer */
  capacity: number;

  /** Whether the buffer is empty */
  isEmpty: boolean;

  /** Whether the buffer is full */
  isFull: boolean;

  /** Number of available slots */
  available: number;

  /** Get the first (oldest) and last (newest) items */
  getFirstAndLast: () => { first: T | undefined; last: T | undefined };

  /** (Optional) access to the manager if needed */
  manager: BufferManager<T>;
}

/**
 * React hook for managing a circular buffer with automatic state updates.
 *
 * Design notes:
 * - BufferManager is stored in a ref (mutable, stable across renders).
 * - React state (`data`) is used to trigger re-renders after mutations.
 * - No setState is called during render; initialization is done via lazy state init.
 *
 * @param capacity - Initial logical capacity (max elements)
 * @param options - Optional configuration
 */
export function useCircularBuffer<T>(
  capacity: number,
  options?: UseCircularBufferOptions<T>
): UseCircularBufferReturn<T> {
  // Create the buffer ONCE per mount (lazy init) and seed initial items.
  const bufferRef = useRef<BufferManager<T> | null>(null);

  const [data, setData] = useState<T[]>(() => {
    const manager = createBuffer<T>(capacity);
    bufferRef.current = manager;

    const initial = options?.initialItems;
    if (initial && initial.length > 0) {
      manager.pushTail(initial);
      return manager.getAll();
    }

    return [];
  });

  const buffer = bufferRef.current!;

  // Keep a stable "sync" helper.
  const sync = useCallback(() => {
    setData(buffer.getAll());
  }, [buffer]);

  // If `capacity` prop changes, resize the underlying buffer.
  // This keeps existing items (and discards oldest if shrinking).
  useEffect(() => {
    buffer.resize(capacity);
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity]);

  // If you want initialItems to apply only once, we are already doing it in lazy init.
  // (If you ever want to re-apply when options.initialItems changes, add an effect intentionally.)

  const pushHead = useCallback(
    (input: T | readonly T[]) => {
      buffer.pushHead(input as any);
      sync();
    },
    [buffer, sync]
  );

  const pushTail = useCallback(
    (input: T | readonly T[]) => {
      buffer.pushTail(input as any);
      sync();
    },
    [buffer, sync]
  );

  const popHead = useMemo<PopFn<T>>(() => {
    const fn = ((count?: number) => {
      const result =
        count === undefined ? buffer.popHead() : buffer.popHead(count);
      sync();
      return result as any;
    }) as PopFn<T>;
    return fn;
  }, [buffer, sync]);

  const popTail = useMemo<PopFn<T>>(() => {
    const fn = ((count?: number) => {
      const result =
        count === undefined ? buffer.popTail() : buffer.popTail(count);
      sync();
      return result as any;
    }) as PopFn<T>;
    return fn;
  }, [buffer, sync]);

  const getHead = useCallback(
    () => buffer.getHead() as T | undefined,
    [buffer]
  );
  const getTail = useCallback(
    () => buffer.getTail() as T | undefined,
    [buffer]
  );

  const clear = useCallback(() => {
    buffer.clear();
    setData([]);
  }, [buffer]);

  const replaceAll = useCallback(
    (items: readonly T[]) => {
      buffer.replaceAll(items);
      sync();
    },
    [buffer, sync]
  );

  const resize = useCallback(
    (newCapacity: number) => {
      buffer.resize(newCapacity);
      sync();
    },
    [buffer, sync]
  );

  const getFirstAndLast = useCallback(() => buffer.getFirstAndLast(), [buffer]);

  // Derived state (recomputed on each render; re-render is triggered by `data` updates)
  const size = buffer.size();
  const cap = buffer.capacity();

  return {
    data,

    pushHead,
    pushTail,
    popHead,
    popTail,

    getHead,
    getTail,

    clear,
    replaceAll,
    resize,

    size,
    capacity: cap,
    isEmpty: buffer.isEmpty(),
    isFull: buffer.isFull(),
    available: buffer.available(),

    getFirstAndLast,

    manager: buffer,
  };
}
