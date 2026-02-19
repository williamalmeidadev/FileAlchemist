import { describe, expect, it } from "vitest";
import { shouldTriggerFileDialog } from "./dropzone";

describe("shouldTriggerFileDialog", () => {
  it("returns true for Enter and Space keys", () => {
    expect(shouldTriggerFileDialog("Enter")).toBe(true);
    expect(shouldTriggerFileDialog(" ")).toBe(true);
  });

  it("returns false for other keys", () => {
    expect(shouldTriggerFileDialog("Escape")).toBe(false);
    expect(shouldTriggerFileDialog("a")).toBe(false);
  });
});
