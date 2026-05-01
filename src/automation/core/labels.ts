import type { LabelDefinition } from './types.js';

/** Single source of truth for DeliveryOS labels (matches legacy setup-labels / install). */
export const DELIVERY_LABELS: LabelDefinition[] = [
  { name: 'intake', color: '0E8A16' },
  { name: 'bug', color: 'D93F0B' },
  { name: 'sprint', color: '1D76DB' },
  { name: 'sprint-active', color: '1D76DB' },
  { name: 'planning', color: '5319E7' },
  { name: 'sprint-planning', color: '5319E7' },
  { name: 'task', color: '7057FF' },
  { name: 'qa', color: 'FBCA04' },
  { name: 'qa-request', color: 'FBCA04' },
  { name: 'production', color: 'D93F0B' },
  { name: 'release', color: 'B60205' },
  { name: 'approval', color: '0E8A16' },
  { name: 'ready-for-deploy', color: '0E8A16' },
  { name: 'declined', color: 'B60205' },
  { name: 'risk', color: 'B60205' },
];
