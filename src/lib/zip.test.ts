import { describe, expect, it } from "vitest";
import { ensureUniqueFilenames } from "./zip";

describe("ensureUniqueFilenames", () => {
  it("keeps unique names unchanged", () => {
    expect(ensureUniqueFilenames(["a.png", "b.png", "c.jpg"])).toEqual([
      "a.png",
      "b.png",
      "c.jpg",
    ]);
  });

  it("adds numeric suffixes for duplicate names", () => {
    expect(ensureUniqueFilenames(["photo.jpg", "photo.jpg", "photo.jpg"])).toEqual([
      "photo.jpg",
      "photo (2).jpg",
      "photo (3).jpg",
    ]);
  });

  it("handles duplicates for names without extension", () => {
    expect(ensureUniqueFilenames(["archive", "archive", "archive"])).toEqual([
      "archive",
      "archive (2)",
      "archive (3)",
    ]);
  });

  it("normalizes blank names and still keeps them unique", () => {
    expect(ensureUniqueFilenames(["", " ", "\t"])).toEqual([
      "file",
      "file (2)",
      "file (3)",
    ]);
  });
});
