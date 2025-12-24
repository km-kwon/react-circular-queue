import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCircularBuffer } from "../src/hooks/useCircularBuffer";

describe("useCircularBuffer", () => {
  describe("Initialization", () => {
    it("should initialize with empty buffer", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(5));

      expect(result.current.data).toEqual([]);
      expect(result.current.size).toBe(0);
      expect(result.current.capacity).toBe(5);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.isFull).toBe(false);
    });

    it("should initialize with initial items", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      expect(result.current.data).toEqual(["A", "B", "C"]);
      expect(result.current.size).toBe(3);
      expect(result.current.isEmpty).toBe(false);
    });

    it("should handle initial items overflow", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(3, { initialItems: [1, 2, 3, 4, 5] })
      );

      expect(result.current.data).toEqual([3, 4, 5]);
      expect(result.current.size).toBe(3);
      expect(result.current.isFull).toBe(true);
    });
  });

  describe("pushTail operation", () => {
    it("should push single item to tail", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(3));

      act(() => {
        result.current.pushTail("A");
      });

      expect(result.current.data).toEqual(["A"]);
      expect(result.current.size).toBe(1);

      act(() => {
        result.current.pushTail("B");
      });

      expect(result.current.data).toEqual(["A", "B"]);
      expect(result.current.size).toBe(2);
    });

    it("should push array to tail", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(5));

      act(() => {
        result.current.pushTail([1, 2, 3]);
      });

      expect(result.current.data).toEqual([1, 2, 3]);
      expect(result.current.size).toBe(3);
    });

    it("should overwrite oldest when buffer is full", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(3));

      act(() => {
        result.current.pushTail(["A", "B", "C", "D"]);
      });

      expect(result.current.data).toEqual(["B", "C", "D"]);
      expect(result.current.isFull).toBe(true);
    });
  });

  describe("pushHead operation", () => {
    it("should push single item to head", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(3));

      act(() => {
        result.current.pushHead("A");
        result.current.pushHead("B");
      });

      expect(result.current.data).toEqual(["B", "A"]);
    });

    it("should push array to head", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(5));

      act(() => {
        result.current.pushHead([1, 2, 3]);
      });

      expect(result.current.data).toEqual([1, 2, 3]);
    });
  });

  describe("popHead operation", () => {
    it("should pop single item from head", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      let popped: string | undefined;
      act(() => {
        popped = result.current.popHead();
      });

      expect(popped).toBe("A");
      expect(result.current.data).toEqual(["B", "C"]);
      expect(result.current.size).toBe(2);
    });

    it("should pop multiple items from head", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3, 4, 5] })
      );

      let popped!: number[];
      act(() => {
        popped = result.current.popHead(3);
      });

      expect(popped).toEqual([1, 2, 3]);
      expect(result.current.data).toEqual([4, 5]);
      expect(result.current.size).toBe(2);
    });

    it("should return undefined when popping from empty buffer", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(5));

      let popped: string | undefined;
      act(() => {
        popped = result.current.popHead();
      });

      expect(popped).toBeUndefined();
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe("popTail operation", () => {
    it("should pop single item from tail", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      let popped: string | undefined;
      act(() => {
        popped = result.current.popTail();
      });

      expect(popped).toBe("C");
      expect(result.current.data).toEqual(["A", "B"]);
    });

    it("should pop multiple items from tail", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3, 4, 5] })
      );

      let popped!: number[];
      act(() => {
        popped = result.current.popTail(3);
      });

      expect(popped).toEqual([5, 4, 3]);
      expect(result.current.data).toEqual([1, 2]);
    });
  });

  describe("getHead and getTail operations", () => {
    it("should peek head without removing", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      const head = result.current.getHead();
      expect(head).toBe("A");
      expect(result.current.size).toBe(3);
    });

    it("should peek tail without removing", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      const tail = result.current.getTail();
      expect(tail).toBe("C");
      expect(result.current.size).toBe(3);
    });
  });

  describe("clear operation", () => {
    it("should clear all items", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3] })
      );

      act(() => {
        result.current.clear();
      });

      expect(result.current.data).toEqual([]);
      expect(result.current.size).toBe(0);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe("replaceAll operation", () => {
    it("should replace all items", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(5, { initialItems: ["A", "B", "C"] })
      );

      act(() => {
        result.current.replaceAll(["X", "Y", "Z"]);
      });

      expect(result.current.data).toEqual(["X", "Y", "Z"]);
      expect(result.current.size).toBe(3);
    });

    it("should replace with overflow", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(3));

      act(() => {
        result.current.replaceAll([1, 2, 3, 4, 5]);
      });

      expect(result.current.data).toEqual([3, 4, 5]);
      expect(result.current.isFull).toBe(true);
    });
  });

  describe("resize operation", () => {
    it("should expand capacity", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(3, { initialItems: [1, 2, 3] })
      );

      act(() => {
        result.current.resize(5);
      });

      expect(result.current.capacity).toBe(5);
      expect(result.current.size).toBe(3);
      expect(result.current.data).toEqual([1, 2, 3]);
      expect(result.current.available).toBe(2);
    });

    it("should shrink capacity and discard oldest", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3, 4, 5] })
      );

      act(() => {
        result.current.resize(3);
      });

      expect(result.current.capacity).toBe(3);
      expect(result.current.size).toBe(3);
      expect(result.current.data).toEqual([3, 4, 5]);
    });
  });

  describe("Dynamic capacity prop change", () => {
    it("should resize when capacity prop changes", () => {
      const { result, rerender } = renderHook(
        ({ capacity }) => useCircularBuffer<number>(capacity),
        { initialProps: { capacity: 3 } }
      );

      act(() => {
        result.current.pushTail([1, 2, 3]);
      });

      expect(result.current.capacity).toBe(3);

      rerender({ capacity: 5 });

      expect(result.current.capacity).toBe(5);
      expect(result.current.data).toEqual([1, 2, 3]);
    });
  });

  describe("Status properties", () => {
    it("should return correct status when empty", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(3));

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.isFull).toBe(false);
      expect(result.current.size).toBe(0);
      expect(result.current.capacity).toBe(3);
      expect(result.current.available).toBe(3);
    });

    it("should return correct status when full", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<string>(3, { initialItems: ["A", "B", "C"] })
      );

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isFull).toBe(true);
      expect(result.current.size).toBe(3);
      expect(result.current.available).toBe(0);
    });

    it("should return correct status when partially filled", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3] })
      );

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isFull).toBe(false);
      expect(result.current.size).toBe(3);
      expect(result.current.available).toBe(2);
    });
  });

  describe("getFirstAndLast helper", () => {
    it("should return first and last items", () => {
      const { result } = renderHook(() =>
        useCircularBuffer<number>(5, { initialItems: [1, 2, 3, 4, 5] })
      );

      const { first, last } = result.current.getFirstAndLast();
      expect(first).toBe(1);
      expect(last).toBe(5);
    });

    it("should return undefined for empty buffer", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(5));

      const { first, last } = result.current.getFirstAndLast();
      expect(first).toBeUndefined();
      expect(last).toBeUndefined();
    });
  });

  describe("manager property", () => {
    it("should expose BufferManager instance", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(5));

      expect(result.current.manager).toBeDefined();
      expect(result.current.manager.capacity()).toBe(5);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle mixed operations correctly", () => {
      const { result } = renderHook(() => useCircularBuffer<string>(5));

      act(() => {
        result.current.pushTail(["A", "B"]);
        result.current.pushHead("Z");
        result.current.pushTail("C");
      });

      expect(result.current.data).toEqual(["Z", "A", "B", "C"]);

      act(() => {
        result.current.popHead();
        result.current.popTail();
      });

      expect(result.current.data).toEqual(["A", "B"]);
    });

    it("should maintain reactivity through many operations", () => {
      const { result } = renderHook(() => useCircularBuffer<number>(10));

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.pushTail(i);
        }
      });

      expect(result.current.size).toBe(10);
      expect(result.current.data).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ]);

      act(() => {
        result.current.popHead(5);
      });

      expect(result.current.size).toBe(5);
      expect(result.current.data).toEqual([15, 16, 17, 18, 19]);
    });
  });
});
