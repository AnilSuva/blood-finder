export function cleanText(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}
