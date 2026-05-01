#!/usr/bin/env node

const AUTOMATION = new Set([
  'issue-event',
  'approval-event',
  'notify',
  'labels-ensure',
  'release-check',
]);

const cmd = process.argv[2];
if (AUTOMATION.has(cmd)) {
  require('../dist/main.js');
} else {
  require('../src/cli.js');
}
