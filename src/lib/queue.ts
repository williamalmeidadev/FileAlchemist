import type { JobItem } from "../types/job";

export function getPendingJobsCount(jobs: readonly JobItem[]): number {
  return jobs.filter((job) => job.status === "pending").length;
}
