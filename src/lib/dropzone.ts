export function shouldTriggerFileDialog(key: string): boolean {
  return key === "Enter" || key === " ";
}
