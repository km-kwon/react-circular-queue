import { Direction } from "../types";

/**
 * A minimal circular buffer implementation with core operations only.
 *
 * - Low-level primitive: use {@link BufferManager} for a user-friendly API.
 * - Supports push/pop in both directions.
 * - `get()` is a non-destructive "peek" operation (does not remove items).
 *
 * Invariants:
 * - `head` points to the oldest element (HEAD).
 * - `tail` points to the next write position for TAIL.
 *
 * @template T - Element type stored in the buffer
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private logicalCapacity: number;
  private size = 0;
  private head = 0;
  private tail = 0;

  /**
   * @param capacity - Initial maximum number of elements the buffer can hold (must be > 0)
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.logicalCapacity = capacity;
    this.buffer = new Array(capacity);
  }

  // ============================================================================
  // Core operations
  // ============================================================================

  /**
   * Push a value into the buffer.
   *
   * If the buffer is full, it overwrites the oldest items depending on direction.
   * - HEAD: inserts before the current head (becomes the new oldest).
   * - TAIL: inserts at the tail (becomes the newest).
   *
   * @param item - Value to store
   * @param direction - Direction.HEAD (head) or Direction.TAIL (tail)
   */
  push(item: T, direction: Direction): void {
    if (direction === Direction.HEAD) {
      this.head = (this.head - 1 + this.capacity) % this.capacity;
      this.buffer[this.head] = item;

      if (this.size < this.logicalCapacity) {
        this.size++;
      } else {
        // Overwrite requires moving tail TAILward to keep size bounded
        this.tail = (this.tail - 1 + this.capacity) % this.capacity;
      }
      return;
    }

    if (direction === Direction.TAIL) {
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;

      if (this.size < this.logicalCapacity) {
        this.size++;
      } else {
        // Overwrite oldest item
        this.head = (this.head + 1) % this.capacity;
      }
      return;
    }

    // Future-proof: if Direction gets extended
    throw new Error(`Invalid direction: ${String(direction)}`);
  }

  /**
   * Pop (remove and return) a single value from the buffer.
   *
   * - HEAD: removes the oldest item.
   * - TAIL: removes the newest item.
   *
   * @param direction - Direction.HEAD (oldest) or Direction.TAIL (newest)
   * @returns The removed item, or undefined if empty
   */
  pop(direction: Direction): T | undefined {
    if (this.size === 0) return undefined;

    if (direction === Direction.HEAD) {
      const item = this.buffer[this.head] as T;
      this.buffer[this.head] = undefined;

      this.head = (this.head + 1) % this.capacity;
      this.size--;

      if (this.size === 0) {
        this.head = 0;
        this.tail = 0;
      }
      return item;
    }

    if (direction === Direction.TAIL) {
      const lastIndex = (this.tail - 1 + this.capacity) % this.capacity;
      const item = this.buffer[lastIndex] as T;
      this.buffer[lastIndex] = undefined;

      this.tail = lastIndex;
      this.size--;

      if (this.size === 0) {
        this.head = 0;
        this.tail = 0;
      }
      return item;
    }

    throw new Error(`Invalid direction: ${String(direction)}`);
  }

  /**
   * Peek item(s) without removing them.
   *
   * - HEAD: returns from oldest -> newer
   * - TAIL: returns from newest -> older
   *
   * @param direction - Direction.HEAD or Direction.TAIL
   * @returns A single item if `count` is omitted; otherwise an array
   */
  get(direction: Direction, count?: number): T | undefined | T[] {
    if (this.size === 0) {
      return count === undefined ? undefined : [];
    }

    // single
    if (count === undefined) {
      if (direction === Direction.HEAD) {
        return this.buffer[this.head] as T;
      }
      if (direction === Direction.TAIL) {
        const lastIndex = (this.tail - 1 + this.capacity) % this.capacity;
        return this.buffer[lastIndex] as T;
      }
      throw new Error(`Invalid direction: ${String(direction)}`);
    }

    // many
    const n = Math.min(Math.max(0, Math.floor(count)), this.size);
    if (n === 0) return [];

    const result = new Array<T>(n);

    if (direction === Direction.HEAD) {
      for (let i = 0; i < n; i++) {
        const idx = (this.head + i) % this.capacity;
        result[i] = this.buffer[idx] as T;
      }
      return result;
    }

    if (direction === Direction.TAIL) {
      let idx = (this.tail - 1 + this.capacity) % this.capacity;
      for (let i = 0; i < n; i++) {
        result[i] = this.buffer[idx] as T;
        idx = (idx - 1 + this.capacity) % this.capacity;
      }
      return result;
    }

    throw new Error(`Invalid direction: ${String(direction)}`);
  }

  // ============================================================================
  // Maintenance
  // ============================================================================

  /**
   * Remove all items and reset indices.
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  /**
   * Resize the buffer's logical capacity.
   *
   * Notes:
   * - When expanding beyond current physical capacity, the underlying storage grows.
   * - When shrinking below current size, oldest items are discarded.
   *
   * @param newCapacity - New logical capacity (must be > 0)
   */
  resize(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }

    if (newCapacity > this.capacity) {
      // Expand underlying storage
      const newBuffer = new Array<T | undefined>(newCapacity);

      for (let i = 0; i < this.size; i++) {
        const oldIndex = (this.head + i) % this.capacity;
        newBuffer[i] = this.buffer[oldIndex];
      }

      this.buffer = newBuffer;
      this.head = 0;
      this.tail = this.size;
      this.capacity = newCapacity;
    } else if (newCapacity < this.size) {
      // Shrink logical size by discarding oldest items
      const dataLoss = this.size - newCapacity;
      this.head = (this.head + dataLoss) % this.capacity;
      this.size = newCapacity;
    }

    this.logicalCapacity = newCapacity;
  }

  // ============================================================================
  // Info
  // ============================================================================

  /**
   * @returns Current number of items.
   */
  getSize(): number {
    return this.size;
  }

  /**
   * @returns Current physical storage capacity.
   * Note: logical capacity may be different after resize.
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * @returns Current logical capacity (the maximum number of items that can be stored).
   */
  getLogicalCapacity(): number {
    return this.logicalCapacity;
  }

  /**
   * Iterate items from oldest -> newest.
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.size; i++) {
      yield this.buffer[(this.head + i) % this.capacity] as T;
    }
  }
}
