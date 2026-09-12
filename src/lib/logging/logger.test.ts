import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/errors/app-error';
import { logger, resetLogSink, setLogSink, type LogRecord } from './logger';
import { REDACTED, redactContext } from './redact';

function captureLogs() {
  const records: LogRecord[] = [];
  setLogSink({ write: (record) => void records.push(record) });
  return records;
}

afterEach(() => {
  resetLogSink();
  vi.unstubAllEnvs();
});

describe('redactContext', () => {
  it('redacts credentials', () => {
    expect(
      redactContext({
        SUPABASE_SECRET_KEY: 'sb_secret_abc',
        accessToken: 'ey...',
        password: 'hunter2',
        authorization: 'Bearer x',
      }),
    ).toEqual({
      SUPABASE_SECRET_KEY: REDACTED,
      accessToken: REDACTED,
      password: REDACTED,
      authorization: REDACTED,
    });
  });

  it('redacts personal identifiers and user written prose', () => {
    expect(
      redactContext({
        email: 'someone@example.com',
        phone: '+49...',
        title: 'Zweimal pro Woche laufen',
        description: 'Ich möchte ruhiger werden',
        note: 'war heute schwer',
      }),
    ).toEqual({
      email: REDACTED,
      phone: REDACTED,
      title: REDACTED,
      description: REDACTED,
      note: REDACTED,
    });
  });

  it('keeps non-personal diagnostic fields', () => {
    expect(
      redactContext({
        goalId: 'g-1',
        plannedCount: 4,
        completedCount: 3,
        offline: true,
        previousState: null,
      }),
    ).toEqual({
      goalId: 'g-1',
      plannedCount: 4,
      completedCount: 3,
      offline: true,
      previousState: null,
    });
  });
});

describe('logger', () => {
  it('redacts context before it reaches the sink', () => {
    const records = captureLogs();

    logger.info('supabase.session.refreshed', { userId: 'u-1', accessToken: 'ey...' });

    expect(records).toHaveLength(1);
    expect(records[0]?.context).toEqual({ userId: 'u-1', accessToken: REDACTED });
  });

  it('logs an AppError without its cause chain', () => {
    const records = captureLogs();
    const cause = new Error('connection refused at 10.0.0.4:5432');

    logger.exception(
      'db.query_failed',
      new AppError('INTERNAL', 'query failed', {
        cause,
        context: { table: 'evidence_events' },
      }),
    );

    expect(records[0]).toMatchObject({
      level: 'error',
      event: 'db.query_failed',
      context: { errorCode: 'INTERNAL', table: 'evidence_events' },
    });
    expect(JSON.stringify(records[0])).not.toContain('10.0.0.4');
  });

  it('logs an unknown throwable without its message', () => {
    const records = captureLogs();

    logger.exception('ui.route_error', new TypeError('user token ey.abc is invalid'));

    expect(records[0]?.context).toEqual({
      errorCode: 'INTERNAL',
      errorName: 'TypeError',
    });
    expect(JSON.stringify(records[0])).not.toContain('ey.abc');
  });

  it('drops debug output in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const records = captureLogs();

    logger.debug('analytics.track', { event: 'action_completed' });
    logger.info('analytics.track', { event: 'action_completed' });

    expect(records.map((record) => record.level)).toEqual(['info']);
  });
});
