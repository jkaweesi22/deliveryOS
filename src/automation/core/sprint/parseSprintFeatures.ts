/**
 * Extract non-empty feature lines from "### Sprint Features" section (legacy GitHub form).
 */
export function parseSprintFeatures(body: string): string[] {
  const featuresMatch = body.match(/### Sprint Features[\s\S]*?(?=###|$)/);
  if (!featuresMatch) return [];

  return featuresMatch[0]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('###'));
}
