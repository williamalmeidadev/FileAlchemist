import { describe, expect, it } from "vitest";
import { getPendingJobsCount } from "./queue";
import type { JobItem } from "../types/job";

function createJob(status: JobItem["status"]): JobItem {
  return {
    id: status,
    file: new File(["x"], `${status}.png`, { type: "image/png", lastModified: 1 }),
    status,
  };
}

describe("getPendingJobsCount", () => {
  it("returns 0 when queue is empty", () => {
    expect(getPendingJobsCount([])).toBe(0);
  });

  it("counts only pending jobs", () => {
    const jobs = [createJob("pending"), createJob("done"), createJob("pending"), createJob("error")];
    expect(getPendingJobsCount(jobs)).toBe(2);
  });
});
