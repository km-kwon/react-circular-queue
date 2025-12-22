import { CircularBuffer } from "./CircularBuffer";
import { Direction, type IBuffer } from "../types";

/**
 * A high-level buffer manager built on top of {@link CircularBuffer}.
 *
 * Provides:
 * - Convenient APIs for pushing/popping single items or arrays
 * - Direction-specific helpers (head/front vs tail/back)
 * - Iterable utilities (forEach/map/filter)
 *
 * Great for:
 * - Logs, streaming feeds, rolling windows, data tables, undo/redo stacks
 *
 * @template T - Element type stored in the buffer
 */
export class BufferManager<T> implements IBuffer<T> {
  private readonly buffer: CircularBuffer<T>;

  private isMany(input: T | readonly T[]): input is readonly T[] {
    return Array.isArray(input);
  }

  /**
   * @param capacity - Maximum number of items to store (logical capacity)
   */
  constructor(capacity: number) {
    this.buffer = new CircularBuffer<T>(capacity);
  }

  // ============================================================================
  // Push (add)
  // ============================================================================

  /**
   * Push item(s) to the head (FRONT / oldest side).
   *
   * When pushing an array, the original order is preserved:
   * `pushHead([a,b,c])` results in `a` being the oldest among the inserted items.
   *
   * Optimization:
   * - If input array length exceeds logical capacity, only the first `capacity` items are processed.
   */
  pushHead(input: T): void;
  pushHead(input: readonly T[]): void;
  pushHead(input: T | readonly T[]): void {
    if (!this.isMany(input)) {
      this.buffer.push(input, Direction.FRONT);
      return;
    }

    const capacity = this.buffer.getLogicalCapacity();
    const itemsToAdd =
      input.length > capacity ? input.slice(0, capacity) : input;

    for (let i = itemsToAdd.length - 1; i >= 0; i--) {
      this.buffer.push(itemsToAdd[i], Direction.FRONT);
    }
  }

  /**
   * Push item(s) to the tail (BACK / newest side).
   *
   * Optimization:
   * - If input array length exceeds logical capacity, only the last `capacity` items are processed.
   */
  pushTail(input: T): void;
  pushTail(input: readonly T[]): void;
  pushTail(input: T | readonly T[]): void {
    if (!this.isMany(input)) {
      this.buffer.push(input, Direction.BACK);
      return;
    }

    const capacity = this.buffer.getLogicalCapacity();
    const itemsToAdd = input.length > capacity ? input.slice(-capacity) : input;

    for (const item of itemsToAdd) {
      this.buffer.push(item, Direction.BACK);
    }
  }

  // ============================================================================
  // Pop (remove)
  // ============================================================================

  /**
   * Pop (remove and return) item(s) from the head (oldest).
   *
   * - `popHead()` returns a single item
   * - `popHead(n)` returns an array of up to `n` items (oldest -> newer)
   */
  popHead(): T | undefined;
  popHead(count: number): T[];
  popHead(count?: number): T | undefined | T[] {
    if (count === undefined) {
      return this.buffer.pop(Direction.FRONT);
    }

    const n = Math.min(Math.max(0, Math.floor(count)), this.size());
    if (n === 0) return [];

    const result = new Array<T>(n);
    for (let i = 0; i < n; i++) {
      // safe because n <= size()
      result[i] = this.buffer.pop(Direction.FRONT) as T;
    }
    return result;
  }

  /**
   * Pop (remove and return) item(s) from the tail (newest).
   *
   * - `popTail()` returns a single item
   * - `popTail(n)` returns an array of up to `n` items (newest -> older)
   */
  popTail(): T | undefined;
  popTail(count: number): T[];
  popTail(count?: number): T | undefined | T[] {
    if (count === undefined) {
      return this.buffer.pop(Direction.BACK);
    }

    const n = Math.min(Math.max(0, Math.floor(count)), this.size());
    if (n === 0) return [];

    const result = new Array<T>(n);
    for (let i = 0; i < n; i++) {
      result[i] = this.buffer.pop(Direction.BACK) as T;
    }
    return result;
  }

  // ============================================================================
  // Peek (read without removing)
  // ============================================================================

  /**
   * Peek item(s) from the head (oldest).
   *
   * - `getHead()` returns a single item
   * - `getHead(n)` returns an array (oldest -> newer)
   */
  getHead(): T | undefined;
  getHead(count: number): T[];
  getHead(count?: number): T | undefined | T[] {
    return count === undefined
      ? this.buffer.get(Direction.FRONT)
      : this.buffer.get(Direction.FRONT, count);
  }

  /**
   * Peek item(s) from the tail (newest).
   *
   * - `getTail()` returns a single item
   * - `getTail(n)` returns an array (newest -> older)
   */
  getTail(): T | undefined;
  getTail(count: number): T[];
  getTail(count?: number): T | undefined | T[] {
    return count === undefined
      ? this.buffer.get(Direction.BACK)
      : this.buffer.get(Direction.BACK, count);
  }

  /**
   * @returns All items as an array (oldest -> newest).
   */
  getAll(): T[] {
    return Array.from(this.buffer);
  }

  // ============================================================================
  // Iteration helpers
  // ============================================================================

  /**
   * Iterate all items (oldest -> newest).
   */
  forEach(callback: (item: T, index: number) => void): void {
    let i = 0;
    for (const item of this.buffer) callback(item, i++);
  }

  /**
   * Map all items (oldest -> newest).
   */
  map<U>(callback: (item: T, index: number) => U): U[] {
    const out: U[] = [];
    let i = 0;
    for (const item of this.buffer) out.push(callback(item, i++));
    return out;
  }

  /**
   * Filter items (oldest -> newest).
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    const out: T[] = [];
    let i = 0;
    for (const item of this.buffer) {
      if (predicate(item, i++)) out.push(item);
    }
    return out;
  }

  // ============================================================================
  // Maintenance / capacity
  // ============================================================================

  /**
   * Clear all items.
   */
  clear(): void {
    this.buffer.clear();
  }

  /**
   * Resize logical capacity.
   */
  resize(newCapacity: number): void {
    this.buffer.resize(newCapacity);
  }

  /**
   * Replace buffer contents with provided items (keeps last `capacity` if overflow).
   */
  replaceAll(items: readonly T[]): void {
    this.clear();
    this.pushTail(items);
  }

  // ============================================================================
  // Status
  // ============================================================================

  /**
   * @returns Current number of items.
   */
  size(): number {
    return this.buffer.getSize();
  }

  /**
   * @returns Logical capacity (max items).
   */
  capacity(): number {
    return this.buffer.getLogicalCapacity();
  }

  /**
   * @returns True if empty.
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * @returns True if full (size === logical capacity).
   */
  isFull(): boolean {
    return this.size() === this.capacity();
  }

  /**
   * @returns Remaining free slots (logical capacity - size).
   */
  available(): number {
    return this.capacity() - this.size();
  }

  // ============================================================================
  // Small helpers
  // ============================================================================

  /**
   * @returns Oldest and newest items.
   */
  getFirstAndLast(): { first: T | undefined; last: T | undefined } {
    return {
      first: this.getHead(),
      last: this.getTail(),
    };
  }

  /**
   * @returns Snapshot of buffer data and count.
   */
  getInfo(): { data: T[]; totalCount: number } {
    return {
      data: this.getAll(),
      totalCount: this.size(),
    };
  }

  /**
   * Make BufferManager iterable (oldest -> newest).
   */
  *[Symbol.iterator](): Iterator<T> {
    yield* this.buffer;
  }
}

/**
 * Factory function to create a new BufferManager.
 *
 * @example
 * ```ts
 * const logBuffer = createBuffer<string>(3);
 * logBuffer.pushTail(["a", "b", "c", "d"]); // keeps last 3: ["b","c","d"]
 * logBuffer.popHead(); // "b"
 * logBuffer.getTail(2); // ["d","c"] (newest -> older)
 * ```
 */
export function createBuffer<T>(capacity: number): BufferManager<T> {
  return new BufferManager<T>(capacity);
}
