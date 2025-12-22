# circular-queue-react

High-performance circular buffer/queue for TypeScript and React. Zero dependencies, perfect for logs, streaming data, and real-time updates.

## Features

- 🔄 **Circular Buffer** - Efficient fixed-size buffer with automatic overflow handling
- 📦 **Buffer Manager** - High-level API for common buffer operations
- ⚛️ **React Hook** - Built-in `useCircularBuffer` hook for React applications
- 🎯 **Type-Safe** - Full TypeScript support with generics
- ⚡ **High Performance** - O(1) operations for push/get
- 🪶 **Zero Dependencies** - Pure TypeScript implementation (React optional)
- 🔧 **Flexible** - Works for logs, streaming data, caching, undo/redo, and more

## Installation

```bash
npm install circular-queue-react
# or
yarn add circular-queue-react
# or
pnpm add circular-queue-react
```

**React Support:** React 16.8+, 17, 18, and 19 ✅

## Quick Start

### CircularBuffer (Low-level API)

```typescript
import { CircularBuffer } from 'circular-queue-react';

// Create a buffer with capacity of 1000
const buffer = new CircularBuffer<string>(1000);

// Add items
buffer.push('item 1');
buffer.push('item 2');
buffer.pushFront('item 0'); // Add to front

// Get items
const first = buffer.first(); // 'item 0'
const last = buffer.last();   // 'item 2'
const item = buffer.get(1);   // 'item 1'

// Convert to array
const all = buffer.toArray(); // ['item 0', 'item 1', 'item 2']

// Iterate
for (const item of buffer) {
  console.log(item);
}

// Resize
buffer.resize(2000);

// Clear
buffer.clear();
```

### BufferManager (High-level API)

```typescript
import { BufferManager, Direction } from 'circular-queue-react';

// Create a buffer manager
const logBuffer = new BufferManager<LogEntry>(1000);

// Add items
logBuffer.push(logEntry);
logBuffer.push(logEntry, Direction.FRONT);

// Add multiple items
logBuffer.pushMany([log1, log2, log3]);

// Get all items
const logs = logBuffer.getAll();

// Get info
const { data, totalCount } = logBuffer.getInfo();

// Get first and last
const { first, last } = logBuffer.getFirstAndLast();

// Replace all
logBuffer.replaceAll([newLog1, newLog2]);
```

### Factory Function

```typescript
import { createBuffer } from 'circular-queue-react';

const buffer = createBuffer<number>(100);
buffer.push(1);
buffer.push(2);
```

### React Hook

```typescript
import { useCircularBuffer } from 'circular-queue-react';

function LogViewer() {
  const {
    data,           // Current buffer data (auto-updates on change)
    push,           // Add item
    pushMany,       // Add multiple items
    clear,          // Clear all
    size,           // Current size
    isEmpty,        // Check if empty
    isFull,         // Check if full
    available       // Available space
  } = useCircularBuffer<string>(100);

  const addLog = () => {
    push(`Log at ${new Date().toISOString()}`);
  };

  return (
    <div>
      <button onClick={addLog}>Add Log</button>
      <button onClick={clear}>Clear</button>
      <div>Logs: {size} / 100 (Available: {available})</div>

      {data.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
}
```

**Hook Options:**

```typescript
// With initial data
const { data, push } = useCircularBuffer<number>(10, {
  initialItems: [1, 2, 3, 4, 5]
});
```

## API Reference

### CircularBuffer<T>

#### Constructor
- `new CircularBuffer<T>(capacity: number)` - Create a new circular buffer

#### Methods
- `push(item: T): void` - Add item to the end
- `pushFront(item: T): void` - Add item to the front
- `get(index: number): T | undefined` - Get item at index
- `first(): T | undefined` - Get first (oldest) item
- `last(): T | undefined` - Get last (newest) item
- `toArray(): T[]` - Convert to array
- `forEach(callback: (item: T, index: number) => void): void` - Iterate
- `map<U>(callback: (item: T, index: number) => U): U[]` - Map items
- `filter(predicate: (item: T, index: number) => boolean): T[]` - Filter items
- `resize(newCapacity: number): void` - Resize buffer
- `clear(): void` - Clear all items
- `length(): number` - Get current size
- `getCapacity(): number` - Get max capacity
- `isEmpty(): boolean` - Check if empty
- `isFull(): boolean` - Check if full
- `available(): number` - Get available space

### BufferManager<T>

Implements `IBuffer<T>` interface with all CircularBuffer methods plus:

- `pushMany(items: T[], direction?: Direction): void` - Add multiple items
- `getAll(): T[]` - Get all items as array
- `getInfo(): { data: T[]; totalCount: number }` - Get buffer info
- `getFirstAndLast(): { first: T | undefined; last: T | undefined }` - Get edges
- `replaceAll(items: T[]): void` - Replace all items
- `size(): number` - Get current size
- `capacity(): number` - Get max capacity

### Direction Enum

```typescript
Direction.FRONT // Add to front
Direction.BACK  // Add to back (default)
```

### useCircularBuffer Hook

React hook for managing circular buffers with automatic re-rendering.

```typescript
function useCircularBuffer<T>(
  capacity: number,
  options?: UseCircularBufferOptions
): UseCircularBufferReturn<T>
```

**Returns:**
- `data: T[]` - Current buffer contents (triggers re-render on change)
- `push: (item: T, direction?: Direction) => void` - Add item
- `pushMany: (items: T[], direction?: Direction) => void` - Add multiple items
- `get: (index: number) => T | undefined` - Get item at index
- `clear: () => void` - Clear all items
- `replaceAll: (items: T[]) => void` - Replace all items
- `resize: (newCapacity: number) => void` - Resize buffer
- `size: number` - Current number of items
- `capacity: number` - Maximum capacity
- `isEmpty: boolean` - Whether buffer is empty
- `isFull: boolean` - Whether buffer is full
- `available: number` - Available space
- `getFirstAndLast: () => { first: T | undefined; last: T | undefined }` - Get edges

**Options:**
- `initialItems?: T[]` - Items to populate the buffer initially

## Use Cases

### 1. React Log Viewer (with Hook)

```typescript
import { useCircularBuffer, Direction } from 'circular-queue-react';

type LogEntry = {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
};

function LogViewer() {
  const { data, push, clear, size, isFull } = useCircularBuffer<LogEntry>(1000);

  const addLog = (level: LogEntry['level'], message: string) => {
    push({
      timestamp: Date.now(),
      level,
      message
    });
  };

  // Filter by level
  const errors = data.filter(log => log.level === 'error');

  return (
    <div>
      <h2>System Logs ({size}/1000) {isFull && '⚠️ FULL'}</h2>

      <div>
        <button onClick={() => addLog('info', 'Test info')}>Add Info</button>
        <button onClick={() => addLog('error', 'Test error')}>Add Error</button>
        <button onClick={clear}>Clear All</button>
      </div>

      <div>
        <h3>Errors: {errors.length}</h3>
        {errors.map((log, i) => (
          <div key={i} style={{ color: 'red' }}>
            {new Date(log.timestamp).toISOString()}: {log.message}
          </div>
        ))}
      </div>

      <h3>All Logs:</h3>
      {data.map((log, i) => (
        <div key={i} style={{
          color: log.level === 'error' ? 'red' :
                 log.level === 'warn' ? 'orange' : 'black'
        }}>
          [{log.level.toUpperCase()}] {log.message}
        </div>
      ))}
    </div>
  );
}
```

### 2. Log Viewer (Vanilla JS)

```typescript
import { createBuffer } from 'circular-queue-react';

type LogEntry = {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
};

// Keep last 10,000 log entries
const logBuffer = createBuffer<LogEntry>(10000);

// Add logs as they come in
function addLog(log: LogEntry) {
  logBuffer.push(log);
}

// Display recent logs
function getRecentLogs(count: number): LogEntry[] {
  const all = logBuffer.getAll();
  return all.slice(-count);
}

// Search logs
function searchLogs(query: string): LogEntry[] {
  return logBuffer.filter(log =>
    log.message.toLowerCase().includes(query.toLowerCase())
  );
}
```

### 3. React Real-time Chart (with Hook)

```typescript
import { useCircularBuffer } from 'circular-queue-react';
import { LineChart, Line } from 'recharts';

function SensorChart() {
  const { data, push } = useCircularBuffer<number>(50);

  // Simulate sensor reading
  useEffect(() => {
    const interval = setInterval(() => {
      const reading = Math.random() * 100;
      push(reading);
    }, 1000);

    return () => clearInterval(interval);
  }, [push]);

  const chartData = data.map((value, index) => ({
    time: index,
    value
  }));

  const average = data.reduce((a, b) => a + b, 0) / data.length || 0;

  return (
    <div>
      <h2>Sensor Monitor</h2>
      <p>Average: {average.toFixed(2)}</p>
      <LineChart width={600} height={300} data={chartData}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
```

### 4. Streaming Data (Vanilla JS)

```typescript
import { CircularBuffer } from 'circular-queue-react';

// Rolling window of sensor readings
const sensorBuffer = new CircularBuffer<number>(100);

function addReading(value: number) {
  sensorBuffer.push(value);
}

function getAverage(): number {
  const readings = sensorBuffer.toArray();
  const sum = readings.reduce((a, b) => a + b, 0);
  return sum / readings.length;
}

function getMax(): number {
  return Math.max(...sensorBuffer.toArray());
}
```

### 5. Undo/Redo System

```typescript
import { CircularBuffer } from 'circular-queue-react';

type Action = {
  type: string;
  undo: () => void;
  redo: () => void;
};

class UndoManager {
  private undoBuffer = new CircularBuffer<Action>(50);
  private redoBuffer = new CircularBuffer<Action>(50);

  do(action: Action) {
    action.redo();
    this.undoBuffer.push(action);
    this.redoBuffer.clear();
  }

  undo() {
    const action = this.undoBuffer.last();
    if (action) {
      action.undo();
      this.redoBuffer.push(action);
    }
  }

  redo() {
    const action = this.redoBuffer.last();
    if (action) {
      action.redo();
      this.undoBuffer.push(action);
    }
  }
}
```

### 6. Rate Limiting / Request Queue

```typescript
import { CircularBuffer } from 'circular-queue-react';

class RateLimiter {
  private requestTimes = new CircularBuffer<number>(100);
  private maxRequests = 100;
  private windowMs = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    // Count requests in current window
    const recentRequests = this.requestTimes.filter(
      time => time > cutoff
    );

    return recentRequests.length < this.maxRequests;
  }

  recordRequest() {
    this.requestTimes.push(Date.now());
  }
}
```

### 7. Cache with LRU-like Behavior

```typescript
import { CircularBuffer } from 'circular-queue-react';

type CacheEntry<T> = {
  key: string;
  value: T;
  timestamp: number;
};

class SimpleCache<T> {
  private buffer = new CircularBuffer<CacheEntry<T>>(1000);

  set(key: string, value: T) {
    this.buffer.push({
      key,
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | undefined {
    // Get most recent entry for key
    const entries = this.buffer.filter(e => e.key === key);
    return entries[entries.length - 1]?.value;
  }

  clear() {
    this.buffer.clear();
  }
}
```

## Performance

All operations are highly optimized:

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| push      | O(1)           | O(1)             |
| pushFront | O(1)           | O(1)             |
| get       | O(1)           | O(1)             |
| first/last| O(1)           | O(1)             |
| toArray   | O(n)           | O(n)             |
| resize    | O(n)           | O(n)             |
| clear     | O(1)           | O(1)             |

## Comparison with Alternatives

### vs. Array

**CircularBuffer advantages:**
- ✅ Fixed memory usage (no unbounded growth)
- ✅ O(1) push operations (Array.shift() is O(n))
- ✅ Automatic overflow handling

**Array advantages:**
- ✅ Built-in, no dependency
- ✅ More flexible size

### vs. Linked List

**CircularBuffer advantages:**
- ✅ Better cache locality (contiguous memory)
- ✅ Lower memory overhead (no node pointers)
- ✅ O(1) random access

**Linked List advantages:**
- ✅ O(1) insertion/deletion anywhere
- ✅ No fixed capacity

## TypeScript Tips

### Type Inference

```typescript
// Type is inferred
const buffer = new CircularBuffer(100);
buffer.push(42);        // OK
buffer.push('string');  // OK (any type)

// Explicit type for safety
const typedBuffer = new CircularBuffer<number>(100);
typedBuffer.push(42);        // OK
typedBuffer.push('string');  // Error!
```

### Interface Types

```typescript
interface LogEntry {
  timestamp: number;
  message: string;
}

const logs = createBuffer<LogEntry>(1000);
```

### Readonly Buffer

```typescript
function getReadonlyView<T>(buffer: CircularBuffer<T>): readonly T[] {
  return buffer.toArray();
}
```

## React Integration

### Installation for React Projects

```bash
npm install circular-queue-react react
# React is a peer dependency (optional)
```

### When to Use the Hook

Use `useCircularBuffer` when you need:
- ✅ Automatic re-rendering when buffer changes
- ✅ React state integration
- ✅ Component lifecycle management

Use `CircularBuffer` or `BufferManager` directly when:
- ✅ You don't need automatic re-rendering
- ✅ You're not using React
- ✅ You want manual control over updates

### Example: Chat Message History

```typescript
import { useCircularBuffer } from 'circular-queue-react';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

function ChatWindow() {
  const { data: messages, push, size } = useCircularBuffer<Message>(100);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      push({
        id: crypto.randomUUID(),
        user: 'You',
        text: input,
        timestamp: Date.now()
      });
      setInput('');
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
      <small>{size} / 100 messages</small>
    </div>
  );
}
```

## Migration from Original Code

If you're migrating from the original `ResizableCircularBuffer` or `TableBuffer`:

```typescript
// Old code
import { ResizableCircularBuffer } from '../services/buffer/circularBuffer';
import { createBuffer } from '../services/buffer/tableBuffer';

// New code
import { CircularBuffer, createBuffer } from 'circular-queue-react';

// API is mostly compatible!
const buffer = new CircularBuffer<LogEntry>(1000); // was ResizableCircularBuffer
const managed = createBuffer<LogEntry>(1000);      // same factory function

// Minor changes:
// - pushfront() → pushFront() (camelCase)
// - Direction constants now in Direction enum
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
