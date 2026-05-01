export interface SprintDateRange {
  start: Date;
  end: Date;
}

/**
 * Parse sprint dates from sprint planning issue body (legacy formats).
 */
export function parseSprintDates(sprintBody: string): SprintDateRange | null {
  const dateMatch1 = sprintBody.match(/Sprint Dates[\s\S]*?(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})/i);
  const dateMatch2a = sprintBody.match(/Sprint Start[\s\S]*?(\d{4}-\d{2}-\d{2})/i);
  const dateMatch2b = sprintBody.match(/Sprint End[\s\S]*?(\d{4}-\d{2}-\d{2})/i);

  if (dateMatch1) {
    return {
      start: new Date(dateMatch1[1]),
      end: new Date(dateMatch1[2]),
    };
  }
  if (dateMatch2a && dateMatch2b) {
    return {
      start: new Date(dateMatch2a[1]),
      end: new Date(dateMatch2b[1]),
    };
  }
  return null;
}

export function timeElapsedPercent(start: Date, end: Date, now: Date): number {
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
}
