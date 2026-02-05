import type { ConvertJob, WorkerMessage } from "../types/image";
import { convertImage } from "../lib/image/convert";

const ctx = self as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<ConvertJob>) => {
  const { id, file, settings } = event.data;

  try {
    const result = await convertImage(file, settings);
    const message: WorkerMessage = { id, ok: true, result };
    ctx.postMessage(message);
  } catch (error) {
    const message: WorkerMessage = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    ctx.postMessage(message);
  }
};
