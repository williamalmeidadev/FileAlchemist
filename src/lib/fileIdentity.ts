export interface FileIdentity {
  name: string;
  size: number;
  lastModified: number;
}

export function createFileFingerprint(file: FileIdentity): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export function filterUniqueFiles<T extends FileIdentity>(
  existing: readonly T[],
  incoming: readonly T[]
): T[] {
  const seen = new Set(existing.map(createFileFingerprint));

  return incoming.filter((file) => {
    const key = createFileFingerprint(file);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
