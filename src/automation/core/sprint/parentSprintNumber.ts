export function parseParentSprintNumber(body: string): number | null {
  const parentMatch = body.match(/Parent Sprint:\s*#(\d+)/);
  if (!parentMatch) return null;
  return parseInt(parentMatch[1], 10);
}
