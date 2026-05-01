import { timeElapsedPercent, type SprintDateRange } from './sprintDates.js';

export interface SprintHealthResult {
  progressPercent: number;
  timePercent: number;
  healthEmoji: string;
  burnDownBar: string;
  updatedBody: string;
}

const STATUS_SECTION = /## 🚦 Sprint Status[\s\S]*?---/g;

export function computeSprintHealth(
  sprintBody: string,
  dateRange: SprintDateRange,
  closedChildCount: number,
  totalChildCount: number,
  now: Date
): SprintHealthResult {
  const timePercent = timeElapsedPercent(dateRange.start, dateRange.end, now);

  const progressPercent =
    totalChildCount === 0 ? 0 : Math.round((closedChildCount / totalChildCount) * 100);

  let healthEmoji = '🟢';
  if (progressPercent < timePercent - 10) healthEmoji = '🔴';
  else if (progressPercent < timePercent) healthEmoji = '🟡';

  const totalBars = 20;
  const filledBars = Math.round((progressPercent / 100) * totalBars);
  const burnDown = '█'.repeat(filledBars) + '░'.repeat(Math.max(0, totalBars - filledBars));

  let updatedBody = sprintBody.replace(STATUS_SECTION, '');

  updatedBody +=
    `\n\n---\n\n## 🚦 Sprint Status\n\n` +
    `Progress: **${progressPercent}%**\n` +
    `Time Elapsed: **${timePercent}%**\n\n` +
    `Health: ${healthEmoji}\n\n` +
    `### 📉 Burn-down\n` +
    `\`${burnDown}\` ${progressPercent}%\n\n---`;

  return {
    progressPercent,
    timePercent,
    healthEmoji,
    burnDownBar: burnDown,
    updatedBody,
  };
}
