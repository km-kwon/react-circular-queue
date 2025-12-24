import { describe, it, expect, beforeEach } from "vitest";
import { CircularBuffer } from "../src/core/CircularBuffer";
import { Direction } from "../src/types";

describe("CircularBuffer", () => {
  describe("Constructor", () => {
    it("should create a buffer with valid capacity", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.getCapacity()).toBe(5);
      expect(buffer.getSize()).toBe(0);
    });

    it("should throw error for invalid capacity", () => {
      expect(() => new CircularBuffer<number>(0)).toThrow(
        "Capacity must be greater than 0"
      );
      expect(() => new CircularBuffer<number>(-1)).toThrow(
        "Capacity must be greater than 0"
      );
    });
  });

  describe("Push operations", () => {
    let buffer: CircularBuffer<string>;

    beforeEach(() => {
      buffer = new CircularBuffer<string>(3);
    });

    it("should push items to TAIL", () => {
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);

      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("A");
      expect(buffer.get(Direction.TAIL)).toBe("C");
    });

    it("should push items to HEAD", () => {
      buffer.push("A", Direction.HEAD);
      buffer.push("B", Direction.HEAD);
      buffer.push("C", Direction.HEAD);

      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("C");
      expect(buffer.get(Direction.TAIL)).toBe("A");
    });

    it("should overwrite oldest item when pushing to full buffer (TAIL)", () => {
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);
      buffer.push("D", Direction.TAIL);

      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("B");
      expect(buffer.get(Direction.TAIL)).toBe("D");
    });

    it("should overwrite newest item when pushing to full buffer (HEAD)", () => {
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);
      buffer.push("D", Direction.HEAD);

      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD)).toBe("D");
      expect(buffer.get(Direction.TAIL)).toBe("B");
    });

    it("should throw error for invalid direction", () => {
      expect(() => buffer.push("X", "invalid" as Direction)).toThrow(
        "Invalid direction"
      );
    });
  });

  describe("Pop operations", () => {
    let buffer: CircularBuffer<string>;

    beforeEach(() => {
      buffer = new CircularBuffer<string>(3);
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);
    });

    it("should pop from HEAD (oldest)", () => {
      const item = buffer.pop(Direction.HEAD);
      expect(item).toBe("A");
      expect(buffer.getSize()).toBe(2);
      expect(buffer.get(Direction.HEAD)).toBe("B");
    });

    it("should pop from TAIL (newest)", () => {
      const item = buffer.pop(Direction.TAIL);
      expect(item).toBe("C");
      expect(buffer.getSize()).toBe(2);
      expect(buffer.get(Direction.TAIL)).toBe("B");
    });

    it("should return undefined when popping from empty buffer", () => {
      buffer.clear();
      expect(buffer.pop(Direction.HEAD)).toBeUndefined();
      expect(buffer.pop(Direction.TAIL)).toBeUndefined();
    });

    it("should reset indices when buffer becomes empty", () => {
      buffer.pop(Direction.HEAD);
      buffer.pop(Direction.HEAD);
      buffer.pop(Direction.HEAD);

      expect(buffer.getSize()).toBe(0);
      buffer.push("X", Direction.TAIL);
      expect(buffer.get(Direction.HEAD)).toBe("X");
    });

    it("should reset indices when buffer becomes empty via popTail", () => {
      buffer.pop(Direction.TAIL);
      buffer.pop(Direction.TAIL);
      buffer.pop(Direction.TAIL);

      expect(buffer.getSize()).toBe(0);
      buffer.push("Y", Direction.TAIL);
      expect(buffer.get(Direction.HEAD)).toBe("Y");
    });

    it("should throw error for invalid direction", () => {
      expect(() => buffer.pop("invalid" as Direction)).toThrow(
        "Invalid direction"
      );
    });
  });

  describe("Get operations (peek)", () => {
    let buffer: CircularBuffer<number>;

    beforeEach(() => {
      buffer = new CircularBuffer<number>(5);
      buffer.push(1, Direction.TAIL);
      buffer.push(2, Direction.TAIL);
      buffer.push(3, Direction.TAIL);
      buffer.push(4, Direction.TAIL);
      buffer.push(5, Direction.TAIL);
    });

    it("should get single item from HEAD without removing", () => {
      const item = buffer.get(Direction.HEAD);
      expect(item).toBe(1);
      expect(buffer.getSize()).toBe(5);
    });

    it("should get single item from TAIL without removing", () => {
      const item = buffer.get(Direction.TAIL);
      expect(item).toBe(5);
      expect(buffer.getSize()).toBe(5);
    });

    it("should get multiple items from HEAD (oldest -> newer)", () => {
      const items = buffer.get(Direction.HEAD, 3);
      expect(items).toEqual([1, 2, 3]);
      expect(buffer.getSize()).toBe(5);
    });

    it("should get multiple items from TAIL (newest -> older)", () => {
      const items = buffer.get(Direction.TAIL, 3);
      expect(items).toEqual([5, 4, 3]);
      expect(buffer.getSize()).toBe(5);
    });

    it("should handle count larger than size", () => {
      const items = buffer.get(Direction.HEAD, 10);
      expect(items).toEqual([1, 2, 3, 4, 5]);
    });

    it("should return empty array for zero or negative count", () => {
      expect(buffer.get(Direction.HEAD, 0)).toEqual([]);
      expect(buffer.get(Direction.HEAD, -1)).toEqual([]);
    });

    it("should return undefined for empty buffer (single)", () => {
      buffer.clear();
      expect(buffer.get(Direction.HEAD)).toBeUndefined();
      expect(buffer.get(Direction.TAIL)).toBeUndefined();
    });

    it("should return empty array for empty buffer (multiple)", () => {
      buffer.clear();
      expect(buffer.get(Direction.HEAD, 5)).toEqual([]);
      expect(buffer.get(Direction.TAIL, 5)).toEqual([]);
    });

    it("should throw error for invalid direction (single)", () => {
      expect(() => buffer.get("invalid" as Direction)).toThrow(
        "Invalid direction"
      );
    });

    it("should throw error for invalid direction (multiple)", () => {
      expect(() => buffer.get("invalid" as Direction, 3)).toThrow(
        "Invalid direction"
      );
    });
  });

  describe("Clear operation", () => {
    it("should clear all items", () => {
      const buffer = new CircularBuffer<string>(3);
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);

      buffer.clear();

      expect(buffer.getSize()).toBe(0);
      expect(buffer.get(Direction.HEAD)).toBeUndefined();
      expect(buffer.get(Direction.TAIL)).toBeUndefined();
    });
  });

  describe("Resize operation", () => {
    it("should expand capacity", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1, Direction.TAIL);
      buffer.push(2, Direction.TAIL);
      buffer.push(3, Direction.TAIL);

      buffer.resize(5);

      expect(buffer.getLogicalCapacity()).toBe(5);
      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD, 3)).toEqual([1, 2, 3]);
    });

    it("should shrink capacity and discard oldest items", () => {
      const buffer = new CircularBuffer<number>(5);
      buffer.push(1, Direction.TAIL);
      buffer.push(2, Direction.TAIL);
      buffer.push(3, Direction.TAIL);
      buffer.push(4, Direction.TAIL);
      buffer.push(5, Direction.TAIL);

      buffer.resize(3);

      expect(buffer.getLogicalCapacity()).toBe(3);
      expect(buffer.getSize()).toBe(3);
      expect(buffer.get(Direction.HEAD, 3)).toEqual([3, 4, 5]);
    });

    it("should throw error for invalid capacity", () => {
      const buffer = new CircularBuffer<number>(3);
      expect(() => buffer.resize(0)).toThrow("Capacity must be greater than 0");
      expect(() => buffer.resize(-1)).toThrow(
        "Capacity must be greater than 0"
      );
    });
  });

  describe("Iterator", () => {
    it("should iterate items from oldest to newest", () => {
      const buffer = new CircularBuffer<string>(3);
      buffer.push("A", Direction.TAIL);
      buffer.push("B", Direction.TAIL);
      buffer.push("C", Direction.TAIL);

      const items = Array.from(buffer);
      expect(items).toEqual(["A", "B", "C"]);
    });

    it("should iterate empty buffer", () => {
      const buffer = new CircularBuffer<string>(3);
      const items = Array.from(buffer);
      expect(items).toEqual([]);
    });

    it("should iterate after wrapping", () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1, Direction.TAIL);
      buffer.push(2, Direction.TAIL);
      buffer.push(3, Direction.TAIL);
      buffer.push(4, Direction.TAIL);
      buffer.push(5, Direction.TAIL);

      const items = Array.from(buffer);
      expect(items).toEqual([3, 4, 5]);
    });
  });

  describe("Info methods", () => {
    it("should return correct size", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.getSize()).toBe(0);

      buffer.push(1, Direction.TAIL);
      expect(buffer.getSize()).toBe(1);

      buffer.push(2, Direction.TAIL);
      expect(buffer.getSize()).toBe(2);
    });

    it("should return correct capacities", () => {
      const buffer = new CircularBuffer<number>(5);
      expect(buffer.getCapacity()).toBe(5);
      expect(buffer.getLogicalCapacity()).toBe(5);

      buffer.resize(10);
      expect(buffer.getCapacity()).toBe(10);
      expect(buffer.getLogicalCapacity()).toBe(10);
    });
  });
});
