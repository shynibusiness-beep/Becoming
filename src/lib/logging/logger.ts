import { isAppError } from '@/lib/errors/app-error';
import { redactContext, type LogContext } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogRecord {
  readonly level: LogLevel;
  readonly event: string;
  readonly context: Record<string, string | number | boolean | null>;
}

export interface LogSink {
  write(record: LogRecord): void;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function minimumLevel(): LogLevel {
  return isProduction() ? 'info' : 'debug';
}

/* eslint-disable no-console -- this module is the single console boundary */
const consoleSink: LogSink = {
  write(record) {
    const payload = isProduction()
      ? JSON.stringify({ ...record, ts: new Date().toISOString() })
      : `[${record.level}] ${record.event}`;

    const detail = isProduction() ? undefined : record.context;

    switch (record.level) {
      case 'debug':
        console.debug(payload, detail ?? '');
        return;
      case 'info':
        console.info(payload, detail ?? '');
        return;
      case 'warn':
        console.warn(payload, detail ?? '');
        return;
      case 'error':
        console.error(payload, detail ?? '');
        return;
    }
  },
};
/* eslint-enable no-console */

let sink: LogSink = consoleSink;

/** Replaces the sink. Used by tests and, later, by a server side log shipper. */
export function setLogSink(next: LogSink): void {
  sink = next;
}

export function resetLogSink(): void {
  sink = consoleSink;
}

function emit(level: LogLevel, event: string, context: LogContext): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minimumLevel()]) {
    return;
  }
  sink.write({ level, event, context: redactContext(context) });
}

/**
 * Structured logger.
 *
 * `event` is a short, stable, non-personal identifier (`supabase.session.refresh_failed`).
 * `context` accepts primitives only and is redacted before it leaves the process.
 */
export const logger = {
  debug: (event: string, context: LogContext = {}) => emit('debug', event, context),
  info: (event: string, context: LogContext = {}) => emit('info', event, context),
  warn: (event: string, context: LogContext = {}) => emit('warn', event, context),
  error: (event: string, context: LogContext = {}) => emit('error', event, context),

  /**
   * Logs a caught error without leaking its cause chain or any message the
   * user may have supplied.
   */
  exception: (event: string, error: unknown, context: LogContext = {}) => {
    if (isAppError(error)) {
      const safe = error.toLogSafe();
      emit('error', event, { ...context, ...safe.context, errorCode: safe.code });
      return;
    }

    emit('error', event, {
      ...context,
      errorCode: 'INTERNAL',
      errorName: error instanceof Error ? error.name : typeof error,
    });
  },
} as const;
