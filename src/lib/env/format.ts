import type { z } from 'zod';

/** Turns a Zod failure into a message that names the variables without printing their values. */
export function formatEnvIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.') || '(root)';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n');
}
