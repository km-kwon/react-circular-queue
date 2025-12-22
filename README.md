# circular-queue-react

High-performance circular buffer/queue for TypeScript and React.  
Zero dependencies (**React optional**) — perfect for logs, streaming data, rolling windows, and real-time UI updates.

---

## Features

- 🔄 **CircularBuffer (Low-level)** — direction-based circular buffer primitive (HEAD/TAIL)
- 📦 **BufferManager (High-level)** — convenient API (push/pop single or arrays, peek helpers, utilities)
- ⚛️ **React Hook** — `useCircularBuffer` for automatic re-rendering in React
- 🎯 **Type-Safe** — full TypeScript generics support
- ⚡ **Fast** — O(1) push/pop/peek operations
- 🪶 **Zero Dependencies** — pure TypeScript implementation (**React is optional**)
- 🔧 **Flexible** — logs, streaming feeds, caching, undo/redo, rolling averages, etc.

---

## Installation

```bash
npm install circular-queue-react
# or
yarn add circular-queue-react
# or
pnpm add circular-queue-react
```

> **React Support:** React 16.8+, 17, 18, 19 ✅
> _(React is required only if you use `useCircularBuffer`.)_

---

## Quick Start

### 1) CircularBuffer (Low-level API)

`CircularBuffer` is a minimal primitive:

- `push(item, direction)` — insert
- `pop(direction)` — remove 1
- `get(direction, count?)` — peek (non-destructive)
- `iterable` (oldest → newest)

```ts
import { CircularBuffer, Direction } from "circular-queue-react";

const buf = new CircularBuffer<string>(3);

// Push to TAIL (newest side)
buf.push("A", Direction.TAIL);
buf.push("B", Direction.TAIL);

// Push to HEAD (oldest side)
buf.push("Z", Direction.HEAD);

console.log(buf.get(Direction.HEAD)); // "Z" (oldest)
console.log(buf.get(Direction.TAIL)); // "B" (newest)

// Peek many
console.log(buf.get(Direction.HEAD, 2)); // ["Z","A"] (oldest -> newer)
console.log(buf.get(Direction.TAIL, 2)); // ["B","A"] (newest -> older)

// Iterate (oldest -> newest)
for (const x of buf) console.log(x);

// Pop
console.log(buf.pop(Direction.HEAD)); // removes oldest ("Z")
console.log(buf.pop(Direction.TAIL)); // removes newest ("B")

// Resize (logical capacity)
buf.resize(10);

// Clear
buf.clear();
```

### 2) BufferManager (High-level API)

`BufferManager` wraps `CircularBuffer` and provides a friendly API:

- `pushHead` / `pushTail` (single item or array)
- `popHead` / `popTail` (single or count)
- `getHead` / `getTail` (single or count)
- utilities: `getAll`, `replaceAll`, `forEach`/`map`/`filter`, `getInfo`, etc.

```ts
import { BufferManager } from "circular-queue-react";

const b = new BufferManager<string>(3);

// pushTail keeps newest at the end (TAIL)
b.pushTail(["A", "B", "C", "D"]);
console.log(b.getAll()); // ["B","C","D"] (keeps last 3)

// pushHead inserts at HEAD, preserves input order
b.pushHead(["X", "Y"]);
console.log(b.getAll()); // ["X","Y","B"] (oldest -> newest)

// Peek
console.log(b.getHead()); // "X"
console.log(b.getTail()); // "B"
console.log(b.getHead(2)); // ["X","Y"] (oldest -> newer)
console.log(b.getTail(2)); // ["B","Y"] (newest -> older)

// Pop
console.log(b.popHead()); // "X"
console.log(b.popTail(2)); // ["B","Y"] (newest -> older)

// Replace all (keeps last capacity if overflow)
b.replaceAll(["1", "2", "3", "4"]);
console.log(b.getAll()); // ["2","3","4"]
```

### 3) Factory Function

```ts
import { createBuffer } from "circular-queue-react";

const buf = createBuffer<number>(3); // returns BufferManager<number>
buf.pushTail([1, 2, 3, 4]); // keeps [2,3,4]
```

### 4) React Hook

`useCircularBuffer` provides a BufferManager-TAILed stateful hook:

- data auto-updates after mutations
- `pushHead` / `pushTail` / `popHead` / `popTail` / `replaceAll` / `clear` / `resize`

```tsx
import { useCircularBuffer } from "circular-queue-react";

export function LogViewer() {
  const { data, pushTail, popHead, clear, size, capacity, available, isFull } =
    useCircularBuffer<string>(100);

  return (
    <div>
      <button onClick={() => pushTail(`Log @ ${new Date().toISOString()}`)}>
        Add Log
      </button>
      <button onClick={() => popHead()}>Pop Oldest</button>
      <button onClick={clear}>Clear</button>

      <div>
        {size}/{capacity} (available: {available}) {isFull && "⚠️ FULL"}
      </div>

      {data.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
}
```

#### Hook options

```ts
const { data } = useCircularBuffer<number>(10, {
  initialItems: [1, 2, 3, 4, 5],
});
```

---

## Order Semantics (Important)

This library uses consistent ordering rules:

- **`getAll()`** always returns **oldest → newest**
- **`getHead(n)`** returns **oldest → newer**
- **`getTail(n)`** returns **newest → older**
- **`popHead(n)`** removes/returns **oldest → newer**
- **`popTail(n)`** removes/returns **newest → older**

---

## Important Type Limitation

**⚠️ When `T` itself is an array type, the array overload for `pushHead`/`pushTail` cannot be used.**

### Why?

TypeScript cannot distinguish between:
- `T` (when `T = number[]`)
- `readonly T[]` (which would be `readonly number[][]`)

Both resolve to array types, making overload resolution ambiguous.

### Example

```ts
// ❌ PROBLEMATIC: T = number[]
const buf = new BufferManager<number[]>(5);

// This will fail! TypeScript cannot tell if you mean:
// 1. Push a single item (which happens to be an array): number[]
// 2. Push multiple items: readonly number[][]
buf.pushTail([[1, 2], [3, 4]]);

// ✅ SOLUTION: Push one item at a time
buf.pushTail([1, 2]);     // Push single array
buf.pushTail([3, 4]);     // Push another single array
```

### Workaround

When `T` is an array type, **always push items one at a time** instead of using the array overload:

```ts
const items: number[][] = [[1, 2], [3, 4], [5, 6]];

// ❌ Don't do this:
// buf.pushTail(items);

// ✅ Do this instead:
for (const item of items) {
  buf.pushTail(item);
}

// Or use a wrapper type:
type Item = { data: number[] };
const typedBuf = new BufferManager<Item>(5);
typedBuf.pushTail([
  { data: [1, 2] },
  { data: [3, 4] }
]); // ✅ Works!
```

This limitation applies to:
- `BufferManager.pushHead()`
- `BufferManager.pushTail()`
- `useCircularBuffer` hook's `pushHead` and `pushTail`

---

## API Reference

### Direction

```ts
Direction.HEAD; // head / oldest side
Direction.TAIL; // tail / newest side
```

### CircularBuffer`<T>`

#### Constructor

- `new CircularBuffer<T>(capacity: number)`

#### Methods

- `push(item: T, direction: Direction): void`
- `pop(direction: Direction): T | undefined`
- `get(direction: Direction): T | undefined`
- `get(direction: Direction, count: number): T[]` HEAD count: oldest → newer, TAIL count: newest → older

- `clear(): void`
- `resize(newCapacity: number): void` (logical capacity)
- `getSize(): number`
- `getCapacity(): number` (physical storage)
- `getLogicalCapacity(): number`
- `[Symbol.iterator](): Iterator<T>` (oldest → newest)

### BufferManager`<T>`

High-level managed buffer built on top of CircularBuffer.

#### Add (Push)

- `pushHead(item: T): void`
- `pushHead(items: readonly T[]): void`
- `pushTail(item: T): void`
- `pushTail(items: readonly T[]): void`

#### Remove (Pop)

- `popHead(): T | undefined`
- `popHead(count: number): T[]` (oldest → newer)
- `popTail(): T | undefined`
- `popTail(count: number): T[]` (newest → older)

#### Peek (Read Without Removing)

- `getHead(): T | undefined`
- `getHead(count: number): T[]` (oldest → newer)
- `getTail(): T | undefined`
- `getTail(count: number): T[]` (newest → older)
- `getAll(): T[]` (oldest → newest)

#### Maintenance / Status

- `clear(): void`
- `resize(newCapacity: number): void`
- `replaceAll(items: readonly T[]): void`
- `size(): number`
- `capacity(): number`
- `isEmpty(): boolean`
- `isFull(): boolean`
- `available(): number`

#### Utilities

- `getFirstAndLast(): { first: T | undefined; last: T | undefined }`
- `getInfo(): { data: T[]; totalCount: number }`
- `forEach(cb): void`
- `map(cb): U[]`
- `filter(cb): T[]`
- `Iterable` (oldest → newest)

### useCircularBuffer Hook

```ts
function useCircularBuffer<T>(
  capacity: number,
  options?: { initialItems?: readonly T[] }
): {
  data: T[];

  pushHead: (input: T | readonly T[]) => void;
  pushTail: (input: T | readonly T[]) => void;

  popHead: { (): T | undefined; (count: number): T[] };
  popTail: { (): T | undefined; (count: number): T[] };

  getHead: () => T | undefined;
  getTail: () => T | undefined;

  clear: () => void;
  replaceAll: (items: readonly T[]) => void;
  resize: (newCapacity: number) => void;

  size: number;
  capacity: number;
  isEmpty: boolean;
  isFull: boolean;
  available: number;

  getFirstAndLast: () => { first: T | undefined; last: T | undefined };

  // advanced:
  manager: BufferManager<T>;
};
```

---

## Use Cases

### 1) React Real-time Log Viewer

```tsx
import { useCircularBuffer } from "circular-queue-react";

type LogEntry = {
  ts: number;
  level: "info" | "warn" | "error";
  message: string;
};

export function LogViewer() {
  const { data, pushTail, clear, size, isFull } =
    useCircularBuffer<LogEntry>(1000);

  const add = (level: LogEntry["level"], message: string) =>
    pushTail({ ts: Date.now(), level, message });

  const errors = data.filter((x) => x.level === "error");

  return (
    <div>
      <h2>
        Logs ({size}/1000) {isFull && "⚠️ FULL"}
      </h2>

      <button onClick={() => add("info", "hello")}>Add</button>
      <button onClick={() => add("error", "oops")}>Add Error</button>
      <button onClick={clear}>Clear</button>

      <h3>Errors: {errors.length}</h3>
      {data.map((x, i) => (
        <div key={i}>
          [{x.level}] {x.message}
        </div>
      ))}
    </div>
  );
}
```

### 2) Rolling Window Average (Vanilla TS)

```ts
import { BufferManager } from "circular-queue-react";

class RollingAverage {
  private buf = new BufferManager<number>(5);

  add(v: number) {
    this.buf.pushTail(v);
  }

  avg() {
    const a = this.buf.getAll();
    return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  }
}
```

---

## Performance

| Operation                       | Complexity |
| ------------------------------- | ---------- |
| **push / pop / get (peek)**     | **O(1)**   |
| **get(count)**                  | **O(k)**   |
| **getAll / iteration snapshot** | **O(n)**   |
| **resize**                      | **O(n)**   |
| **clear**                       | **O(1)**   |

---

## License

MIT

## Contributing

PRs are welcome!

If you find a bug or want a feature, please open an issue.
