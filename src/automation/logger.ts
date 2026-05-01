import type { JsonValue } from './core/types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const jsonLogs = process.env.DELIVERY_OS_LOG_FORMAT === 'json';

function emit(level: LogLevel, payload: Record<string, JsonValue>): void {
  if (jsonLogs) {
    const line = JSON.stringify({ level, ts: new Date().toISOString(), ...payload });
    if (level === 'error') console.error(line);
    else console.log(line);
    return;
  }
  const msg = String(payload.msg ?? '');
  const copy: Record<string, JsonValue> = { ...payload };
  delete copy.msg;
  const suffix = Object.keys(copy).length ? ` ${JSON.stringify(copy)}` : '';
  const line = `[${level}] ${msg}${suffix}`;
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  debug(p: Record<string, JsonValue>): void {
    if (process.env.DELIVERY_OS_LOG_LEVEL === 'debug') emit('debug', p);
  },
  info(p: Record<string, JsonValue>): void {
    emit('info', p);
  },
  warn(p: Record<string, JsonValue>): void {
    emit('warn', p);
  },
  error(p: Record<string, JsonValue>): void {
    emit('error', p);
  },
};
