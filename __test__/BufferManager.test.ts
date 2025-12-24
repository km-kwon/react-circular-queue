import { describe, it, expect, beforeEach } from "vitest";
import { BufferManager, createBuffer } from "../src/core/BufferManager";

describe("BufferManager", () => {
  describe("Constructor and Factory", () => {
    it("should create a buffer with valid capacity", () => {
      const buffer = new BufferManager<number>(5);
      expect(buffer.capacity()).toBe(5);
      expect(buffer.size()).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
    });

    it("should create buffer via factory function", () => {
      const buffer = createBuffer<string>(3);
      expect(buffer.capacity()).toBe(3);
      expect(buffer.size()).toBe(0);
    });
  });

  describe("pushTail operations", () => {
    let buffer: BufferManager<string>;

    beforeEach(() => {
      buffer = new BufferManager<string>(3);
    });

    it("should push single item to tail", () => {
      buffer.pushTail("A");
      buffer.pushTail("B");

      expect(buffer.size()).toBe(2);
      expect(buffer.getAll()).toEqual(["A", "B"]);
    });

    it("should push array to tail", () => {
      buffer.pushTail(["A", "B", "C"]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["A", "B", "C"]);
    });

    it("should keep last items when pushing array larger than capacity", () => {
      buffer.pushTail(["A", "B", "C", "D", "E"]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["C", "D", "E"]);
    });

    it("should overwrite oldest items when buffer is full", () => {
      buffer.pushTail(["A", "B", "C"]);
      buffer.pushTail("D");

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["B", "C", "D"]);
    });
  });

  describe("pushHead operations", () => {
    let buffer: BufferManager<string>;

    beforeEach(() => {
      buffer = new BufferManager<string>(3);
    });

    it("should push single item to head", () => {
      buffer.pushHead("A");
      buffer.pushHead("B");

      expect(buffer.size()).toBe(2);
      expect(buffer.getAll()).toEqual(["B", "A"]);
    });

    it("should push array to head preserving order", () => {
      buffer.pushHead(["A", "B", "C"]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["A", "B", "C"]);
    });

    it("should keep first items when pushing array larger than capacity", () => {
      buffer.pushHead(["A", "B", "C", "D", "E"]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["A", "B", "C"]);
    });

    it("should work correctly with mixed pushHead and pushTail", () => {
      buffer.pushTail(["A", "B"]);
      buffer.pushHead("Z");

      expect(buffer.getAll()).toEqual(["Z", "A", "B"]);
    });
  });

  describe("popHead operations", () => {
    let buffer: BufferManager<number>;

    beforeEach(() => {
      buffer = new BufferManager<number>(5);
      buffer.pushTail([1, 2, 3, 4, 5]);
    });

    it("should pop single item from head (oldest)", () => {
      const item = buffer.popHead();
      expect(item).toBe(1);
      expect(buffer.size()).toBe(4);
      expect(buffer.getAll()).toEqual([2, 3, 4, 5]);
    });

    it("should pop multiple items from head (oldest -> newer)", () => {
      const items = buffer.popHead(3);
      expect(items).toEqual([1, 2, 3]);
      expect(buffer.size()).toBe(2);
      expect(buffer.getAll()).toEqual([4, 5]);
    });

    it("should return undefined when popping from empty buffer", () => {
      buffer.clear();
      expect(buffer.popHead()).toBeUndefined();
    });

    it("should return empty array when count is 0", () => {
      expect(buffer.popHead(0)).toEqual([]);
    });

    it("should handle count larger than size", () => {
      const items = buffer.popHead(10);
      expect(items).toEqual([1, 2, 3, 4, 5]);
      expect(buffer.isEmpty()).toBe(true);
    });
  });

  describe("popTail operations", () => {
    let buffer: BufferManager<number>;

    beforeEach(() => {
      buffer = new BufferManager<number>(5);
      buffer.pushTail([1, 2, 3, 4, 5]);
    });

    it("should pop single item from tail (newest)", () => {
      const item = buffer.popTail();
      expect(item).toBe(5);
      expect(buffer.size()).toBe(4);
      expect(buffer.getAll()).toEqual([1, 2, 3, 4]);
    });

    it("should pop multiple items from tail (newest -> older)", () => {
      const items = buffer.popTail(3);
      expect(items).toEqual([5, 4, 3]);
      expect(buffer.size()).toBe(2);
      expect(buffer.getAll()).toEqual([1, 2]);
    });

    it("should return undefined when popping from empty buffer", () => {
      buffer.clear();
      expect(buffer.popTail()).toBeUndefined();
    });

    it("should return empty array when count is 0", () => {
      expect(buffer.popTail(0)).toEqual([]);
    });
  });

  describe("getHead operations", () => {
    let buffer: BufferManager<string>;

    beforeEach(() => {
      buffer = new BufferManager<string>(5);
      buffer.pushTail(["A", "B", "C", "D", "E"]);
    });

    it("should get single item from head without removing", () => {
      const item = buffer.getHead();
      expect(item).toBe("A");
      expect(buffer.size()).toBe(5);
    });

    it("should get multiple items from head (oldest -> newer)", () => {
      const items = buffer.getHead(3);
      expect(items).toEqual(["A", "B", "C"]);
      expect(buffer.size()).toBe(5);
    });

    it("should return undefined for empty buffer", () => {
      buffer.clear();
      expect(buffer.getHead()).toBeUndefined();
    });
  });

  describe("getTail operations", () => {
    let buffer: BufferManager<string>;

    beforeEach(() => {
      buffer = new BufferManager<string>(5);
      buffer.pushTail(["A", "B", "C", "D", "E"]);
    });

    it("should get single item from tail without removing", () => {
      const item = buffer.getTail();
      expect(item).toBe("E");
      expect(buffer.size()).toBe(5);
    });

    it("should get multiple items from tail (newest -> older)", () => {
      const items = buffer.getTail(3);
      expect(items).toEqual(["E", "D", "C"]);
      expect(buffer.size()).toBe(5);
    });

    it("should return undefined for empty buffer", () => {
      buffer.clear();
      expect(buffer.getTail()).toBeUndefined();
    });
  });

  describe("getAll operation", () => {
    it("should return all items in order (oldest -> newest)", () => {
      const buffer = new BufferManager<number>(5);
      buffer.pushTail([1, 2, 3, 4, 5]);

      expect(buffer.getAll()).toEqual([1, 2, 3, 4, 5]);
    });

    it("should return empty array for empty buffer", () => {
      const buffer = new BufferManager<number>(5);
      expect(buffer.getAll()).toEqual([]);
    });
  });

  describe("Iteration helpers", () => {
    let buffer: BufferManager<number>;

    beforeEach(() => {
      buffer = new BufferManager<number>(5);
      buffer.pushTail([1, 2, 3, 4, 5]);
    });

    it("should forEach items in order", () => {
      const items: number[] = [];
      buffer.forEach((item) => items.push(item));
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it("should forEach with index", () => {
      const indices: number[] = [];
      buffer.forEach((_, index) => indices.push(index));
      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it("should map items", () => {
      const doubled = buffer.map((item) => item * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });

    it("should filter items", () => {
      const evens = buffer.filter((item) => item % 2 === 0);
      expect(evens).toEqual([2, 4]);
    });

    it("should work with iterator", () => {
      const items = Array.from(buffer);
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Maintenance operations", () => {
    it("should clear all items", () => {
      const buffer = new BufferManager<string>(3);
      buffer.pushTail(["A", "B", "C"]);
      buffer.clear();

      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.size()).toBe(0);
      expect(buffer.getAll()).toEqual([]);
    });

    it("should resize capacity", () => {
      const buffer = new BufferManager<number>(3);
      buffer.pushTail([1, 2, 3]);

      buffer.resize(5);
      expect(buffer.capacity()).toBe(5);
      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual([1, 2, 3]);
    });

    it("should replaceAll with new items", () => {
      const buffer = new BufferManager<string>(5);
      buffer.pushTail(["A", "B", "C"]);
      buffer.replaceAll(["X", "Y", "Z"]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual(["X", "Y", "Z"]);
    });

    it("should replaceAll with overflow", () => {
      const buffer = new BufferManager<number>(3);
      buffer.replaceAll([1, 2, 3, 4, 5]);

      expect(buffer.size()).toBe(3);
      expect(buffer.getAll()).toEqual([3, 4, 5]);
    });
  });

  describe("Status methods", () => {
    let buffer: BufferManager<string>;

    beforeEach(() => {
      buffer = new BufferManager<string>(3);
    });

    it("should return correct size", () => {
      expect(buffer.size()).toBe(0);
      buffer.pushTail("A");
      expect(buffer.size()).toBe(1);
      buffer.pushTail("B");
      expect(buffer.size()).toBe(2);
    });

    it("should return correct capacity", () => {
      expect(buffer.capacity()).toBe(3);
    });

    it("should return correct isEmpty status", () => {
      expect(buffer.isEmpty()).toBe(true);
      buffer.pushTail("A");
      expect(buffer.isEmpty()).toBe(false);
      buffer.popHead();
      expect(buffer.isEmpty()).toBe(true);
    });

    it("should return correct isFull status", () => {
      expect(buffer.isFull()).toBe(false);
      buffer.pushTail(["A", "B", "C"]);
      expect(buffer.isFull()).toBe(true);
      buffer.popHead();
      expect(buffer.isFull()).toBe(false);
    });

    it("should return correct available count", () => {
      expect(buffer.available()).toBe(3);
      buffer.pushTail("A");
      expect(buffer.available()).toBe(2);
      buffer.pushTail(["B", "C"]);
      expect(buffer.available()).toBe(0);
    });
  });

  describe("Helper methods", () => {
    it("should return first and last items", () => {
      const buffer = new BufferManager<number>(5);
      buffer.pushTail([1, 2, 3, 4, 5]);

      const { first, last } = buffer.getFirstAndLast();
      expect(first).toBe(1);
      expect(last).toBe(5);
    });

    it("should return undefined for empty buffer", () => {
      const buffer = new BufferManager<number>(5);
      const { first, last } = buffer.getFirstAndLast();
      expect(first).toBeUndefined();
      expect(last).toBeUndefined();
    });

    it("should return buffer info", () => {
      const buffer = new BufferManager<string>(3);
      buffer.pushTail(["A", "B", "C"]);

      const info = buffer.getInfo();
      expect(info.data).toEqual(["A", "B", "C"]);
      expect(info.totalCount).toBe(3);
    });
  });

  describe("Edge cases", () => {
    it("should handle capacity of 1", () => {
      const buffer = new BufferManager<string>(1);
      buffer.pushTail("A");
      expect(buffer.getAll()).toEqual(["A"]);

      buffer.pushTail("B");
      expect(buffer.getAll()).toEqual(["B"]);
    });

    it("should handle many push operations", () => {
      const buffer = new BufferManager<number>(100);
      for (let i = 0; i < 1000; i++) {
        buffer.pushTail(i);
      }
      expect(buffer.size()).toBe(100);
      expect(buffer.getHead()).toBe(900);
      expect(buffer.getTail()).toBe(999);
    });

    it("should handle alternating push and pop", () => {
      const buffer = new BufferManager<number>(3);
      buffer.pushTail(1);
      buffer.pushTail(2);
      expect(buffer.popHead()).toBe(1);
      buffer.pushTail(3);
      buffer.pushTail(4);
      expect(buffer.getAll()).toEqual([2, 3, 4]);
    });
  });
});
