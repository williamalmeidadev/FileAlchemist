import { describe, expect, it } from "vitest";
import { createFileFingerprint, filterUniqueFiles, type FileIdentity } from "./fileIdentity";

describe("createFileFingerprint", () => {
  it("builds a deterministic key from file identity", () => {
    const file: FileIdentity = { name: "photo.png", size: 128, lastModified: 99 };
    expect(createFileFingerprint(file)).toBe("photo.png::128::99");
  });
});

describe("filterUniqueFiles", () => {
  it("skips files already present in the queue", () => {
    const existing: FileIdentity[] = [{ name: "a.png", size: 10, lastModified: 1 }];
    const incoming: FileIdentity[] = [
      { name: "a.png", size: 10, lastModified: 1 },
      { name: "b.png", size: 20, lastModified: 2 },
    ];

    expect(filterUniqueFiles(existing, incoming)).toEqual([{ name: "b.png", size: 20, lastModified: 2 }]);
  });

  it("skips duplicates within the same incoming batch", () => {
    const incoming: FileIdentity[] = [
      { name: "dup.jpg", size: 30, lastModified: 7 },
      { name: "dup.jpg", size: 30, lastModified: 7 },
      { name: "unique.jpg", size: 40, lastModified: 8 },
    ];

    expect(filterUniqueFiles([], incoming)).toEqual([
      { name: "dup.jpg", size: 30, lastModified: 7 },
      { name: "unique.jpg", size: 40, lastModified: 8 },
    ]);
  });
});
