/**
 * Direction for buffer operations.
 *
 * - HEAD: head / oldest side
 * - TAIL: tail / newest side
 */
export const Direction = {
  /** HEAD side (head / oldest) */
  HEAD: "head",
  /** TAIL side (tail / newest) */
  TAIL: "tail",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

/**
 * Common managed-buffer interface.
 *
 * Notes:
 * - `pushHead/pushTail` accept either a single item or a (readonly) array of items.
 * - `popHead/popTail`:
 *   - without args: returns a single item (or undefined if empty)
 *   - with `count`: returns an array (order depends on method)
 *     - popHead(n): oldest -> newer
 *     - popTail(n): newest -> older
 *
 * @template T - Element type stored in the buffer
 */
export interface IBuffer<T> {
  // ============================================================================
  // Core operations (add)
  // ============================================================================

  /**
   * Add one item to the head (HEAD / oldest side).
   */
  pushHead(item: T): void;

  /**
   * Add multiple items to the head (HEAD / oldest side).
   *
   * Implementations should preserve original order:
   * `pushHead([a,b,c])` => `a` becomes oldest among inserted items.
   */
  pushHead(items: readonly T[]): void;

  /**
   * Add one item to the tail (TAIL / newest side).
   */
  pushTail(item: T): void;

  /**
   * Add multiple items to the tail (TAIL / newest side).
   */
  pushTail(items: readonly T[]): void;

  // ============================================================================
  // Core operations (remove)
  // ============================================================================

  /**
   * Remove and return the oldest item (from head).
   * @returns The removed item, or undefined if empty
   */
  popHead(): T | undefined;

  /**
   * Remove and return up to `count` oldest items (from head).
   * @param count - Max number of items to remove
   * @returns Removed items in order: oldest -> newer
   */
  popHead(count: number): T[];

  /**
   * Remove and return the newest item (from tail).
   * @returns The removed item, or undefined if empty
   */
  popTail(): T | undefined;

  /**
   * Remove and return up to `count` newest items (from tail).
   * @param count - Max number of items to remove
   * @returns Removed items in order: newest -> older
   */
  popTail(count: number): T[];

  // ============================================================================
  // Peek / read (non-destructive)
  // ============================================================================

  /**
   * Peek the oldest item (head) without removing.
   */
  getHead(): T | undefined;

  /**
   * Peek the newest item (tail) without removing.
   */
  getTail(): T | undefined;

  /**
   * Get all items as an array (oldest -> newest).
   */
  getAll(): T[];

  // ============================================================================
  // Maintenance
  // ============================================================================

  /**
   * Remove all items.
   */
  clear(): void;

  // ============================================================================
  // Capacity management
  // ============================================================================

  /**
   * @returns Current number of items.
   */
  size(): number;

  /**
   * @returns Logical maximum capacity (max items).
   */
  capacity(): number;

  /**
   * Resize the logical capacity.
   *
   * If shrinking below current size, implementations may discard oldest items.
   */
  resize(newCapacity: number): void;

  // ============================================================================
  // Utility methods
  // ============================================================================

  /**
   * @returns First (oldest) and last (newest) items.
   */
  getFirstAndLast(): { first: T | undefined; last: T | undefined };

  /**
   * Replace all items with `items`.
   *
   * If overflow happens, implementations should follow their own overflow policy
   * (typically keeping the last `capacity()` items).
   */
  replaceAll(items: readonly T[]): void;

  /**
   * @returns Snapshot of buffer data and item count.
   */
  getInfo(): { data: T[]; totalCount: number };

  // ============================================================================
  // Status checks
  // ============================================================================

  /**
   * @returns True if empty.
   */
  isEmpty(): boolean;

  /**
   * @returns True if full.
   */
  isFull(): boolean;

  /**
   * @returns Number of available free slots (capacity - size).
   */
  available(): number;

  // ============================================================================
  // Iteration helpers
  // ============================================================================

  /**
   * Iterate over all items (oldest -> newest).
   */
  forEach(callback: (item: T, index: number) => void): void;

  /**
   * Map items (oldest -> newest).
   */
  map<U>(callback: (item: T, index: number) => U): U[];

  /**
   * Filter items (oldest -> newest).
   */
  filter(predicate: (item: T, index: number) => boolean): T[];
}
