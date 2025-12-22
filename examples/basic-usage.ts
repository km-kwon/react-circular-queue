/**
 * Basic usage examples for `circular-queue-react`
 *
 * This file demonstrates:
 * - CircularBuffer (low-level): push/pop/get by Direction
 * - BufferManager (high-level): convenience APIs (single/array push, multi-pop, peek, utilities)
 */

import { CircularBuffer, BufferManager, createBuffer, Direction } from "../src";

// ============================================================================
// Example 1: CircularBuffer (Low-level API)
// ============================================================================

console.log("Example 1: CircularBuffer (Low-level API)");
console.log("==========================================");

type LogEntry = {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
};

const logBuffer = new CircularBuffer<LogEntry>(5); // Small capacity for demo

// Add some logs using push with Direction.TAIL (newest side)
logBuffer.push(
  { timestamp: Date.now(), level: "info", message: "Application started" },
  Direction.TAIL
);
logBuffer.push(
  { timestamp: Date.now(), level: "info", message: "Loading configuration" },
  Direction.TAIL
);
logBuffer.push(
  { timestamp: Date.now(), level: "warn", message: "Cache is full" },
  Direction.TAIL
);
logBuffer.push(
  { timestamp: Date.now(), level: "error", message: "Connection failed" },
  Direction.TAIL
);

console.log("Total logs:", logBuffer.getSize());
console.log("Oldest (HEAD):", logBuffer.get(Direction.HEAD));
console.log("Newest (TAIL):", logBuffer.get(Direction.TAIL));

// Peek multiple without removing
console.log(
  "Peek newest 2 (TAIL, newest->older):",
  logBuffer.get(Direction.TAIL, 2)
);

// Add more logs (will overflow)
logBuffer.push(
  { timestamp: Date.now(), level: "info", message: "Retrying connection" },
  Direction.TAIL
);
logBuffer.push(
  { timestamp: Date.now(), level: "info", message: "Connection successful" },
  Direction.TAIL
);

console.log("\nAfter overflow:");
console.log("Total logs (still 5):", logBuffer.getSize());
console.log("Oldest (HEAD):", logBuffer.get(Direction.HEAD));
console.log("All logs (oldest->newest):", Array.from(logBuffer));

// Remove one item using pop
const removed = logBuffer.pop(Direction.HEAD);
console.log("\nRemoved from HEAD:", removed);
console.log("Size after pop:", logBuffer.getSize());

// ============================================================================
// Example 2: BufferManager (High-level API)
// ============================================================================

console.log("\n\nExample 2: BufferManager (High-level API)");
console.log("==========================================");

const messageBuffer = new BufferManager<string>(10);

// Add to tail (TAIL)
messageBuffer.pushTail("Message 1");
messageBuffer.pushTail("Message 2");
messageBuffer.pushTail("Message 3");

console.log("Messages:", messageBuffer.getAll());

// Add to head (HEAD)
messageBuffer.pushHead("Priority Message!");
console.log("After adding to head:", messageBuffer.getAll());

// Add multiple items at once (array input supported)
messageBuffer.pushTail(["Msg 4", "Msg 5", "Msg 6"]);
console.log("After bulk add:", messageBuffer.getAll());

// Peek first/last (non-destructive)
console.log("Peek head:", messageBuffer.getHead());
console.log("Peek tail:", messageBuffer.getTail());
console.log("Peek head 3:", messageBuffer.getHead(3));
console.log("Peek tail 3 (newest->older):", messageBuffer.getTail(3));

// Get first and last via helper
const { first, last } = messageBuffer.getFirstAndLast();
console.log("First (oldest):", first);
console.log("Last (newest):", last);

// Pop items
const oldestItem = messageBuffer.popHead();
console.log("\nPopped from head:", oldestItem);

const newestTwo = messageBuffer.popTail(2);
console.log("Popped 2 from tail (newest->older):", newestTwo);

console.log("Remaining:", messageBuffer.getAll());

// ============================================================================
// Example 3: Iterating and Transforming
// ============================================================================

console.log("\n\nExample 3: Iterating and Transforming");
console.log("======================================");

const numberBuffer = createBuffer<number>(10);
numberBuffer.pushTail([1, 2, 3, 4, 5]);

console.log("forEach:");
numberBuffer.forEach((num, index) => {
  console.log(`  [${index}] = ${num}`);
});

const doubled = numberBuffer.map((num) => num * 2);
console.log("\nDoubled:", doubled);

const evenNumbers = numberBuffer.filter((num) => num % 2 === 0);
console.log("Even numbers:", evenNumbers);

console.log("\nUsing for...of:");
for (const num of numberBuffer) {
  console.log(`  - ${num}`);
}

// ============================================================================
// Example 4: Resizing
// ============================================================================

console.log("\n\nExample 4: Resizing");
console.log("====================");

const resizableBuffer = createBuffer<string>(3);
resizableBuffer.pushTail(["A", "B", "C"]);

console.log("Initial (capacity=3):", resizableBuffer.getAll());
console.log("Is full?", resizableBuffer.isFull());

// Expand
resizableBuffer.resize(5);
console.log("\nAfter resize to 5:", resizableBuffer.getAll());
console.log("Capacity:", resizableBuffer.capacity());
console.log("Available space:", resizableBuffer.available());

// Add more items
resizableBuffer.pushTail("D");
resizableBuffer.pushTail("E");
console.log("After adding D, E:", resizableBuffer.getAll());
console.log("Is full now?", resizableBuffer.isFull());

// Shrink (will discard oldest items if needed)
resizableBuffer.resize(3);
console.log("\nAfter resize to 3:", resizableBuffer.getAll());

// ============================================================================
// Example 5: Real-world - Rolling Average
// ============================================================================

console.log("\n\nExample 5: Rolling Average Calculator");
console.log("======================================");

class RollingAverage {
  private buffer: BufferManager<number>;

  constructor(windowSize: number) {
    this.buffer = new BufferManager<number>(windowSize);
  }

  addValue(value: number): void {
    this.buffer.pushTail(value);
  }

  getAverage(): number {
    if (this.buffer.isEmpty()) return 0;

    const values = this.buffer.getAll();
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  getMax(): number {
    if (this.buffer.isEmpty()) return 0;
    return Math.max(...this.buffer.getAll());
  }

  getMin(): number {
    if (this.buffer.isEmpty()) return 0;
    return Math.min(...this.buffer.getAll());
  }
}

const rollingAvg = new RollingAverage(5);

// Simulate sensor readings
const readings = [23.5, 24.1, 23.8, 24.5, 25.0, 24.8, 24.2];
for (const reading of readings) {
  rollingAvg.addValue(reading);
  console.log(
    `Reading: ${reading.toFixed(1)}°C | ` +
      `Avg: ${rollingAvg.getAverage().toFixed(2)}°C | ` +
      `Min: ${rollingAvg.getMin().toFixed(1)}°C | ` +
      `Max: ${rollingAvg.getMax().toFixed(1)}°C`
  );
}

// ============================================================================
// Example 6: Replace All
// ============================================================================

console.log("\n\nExample 6: Replace All");
console.log("=======================");

const taskBuffer = createBuffer<string>(5);

// (old: pushMany) -> (new: pushTail supports array)
taskBuffer.pushTail(["Task 1", "Task 2", "Task 3"]);
console.log("Initial tasks:", taskBuffer.getAll());

// Replace with new tasks (keeps last `capacity` if overflow)
taskBuffer.replaceAll(["New Task A", "New Task B", "New Task C", "New Task D"]);
console.log("After replace:", taskBuffer.getAll());

const info = taskBuffer.getInfo();
console.log("Buffer info:", info);

console.log("\n✅ All examples completed!");
