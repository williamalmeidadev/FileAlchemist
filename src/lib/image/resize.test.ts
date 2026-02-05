import { describe, expect, it } from "vitest";
import { calculateTargetSize } from "./resize";

describe("calculateTargetSize", () => {
  it("keeps original size when no resize", () => {
    expect(calculateTargetSize(1200, 800)).toEqual({ width: 1200, height: 800 });
  });

  it("scales by width while keeping aspect", () => {
    expect(calculateTargetSize(1200, 800, { width: 600 })).toEqual({
      width: 600,
      height: 400,
    });
  });

  it("limits to max dimension", () => {
    expect(calculateTargetSize(4000, 2000, { maxDimension: 1000 })).toEqual({
      width: 1000,
      height: 500,
    });
  });
});
