import { QueuedWrite } from '../types/index.js';
import { flushQueuedWrite } from './sheetsService.js';

// ─── In-memory queue store ────────────────────────────────────────────────────
// Key: Google access token (unique per user session)
// Value: list of pending writes
//
// Note: This is reset on server restart. For production persistence, swap the
// Map for a Redis store or a database table.

const queue = new Map<string, QueuedWrite[]>();

const MAX_ATTEMPTS = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId(): string {
  return `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Adds a write operation to the pending queue for the given token.
 */
export function enqueue(
  token: string,
  write: Omit<QueuedWrite, 'id' | 'createdAt' | 'attempts'>
): void {
  const item: QueuedWrite = {
    ...write,
    id: makeId(),
    createdAt: new Date().toISOString(),
    attempts: 0
  };
  const existing = queue.get(token) ?? [];
  queue.set(token, [...existing, item]);
}

/**
 * Returns the number of pending writes for a given token.
 */
export function queueSize(token: string): number {
  return (queue.get(token) ?? []).length;
}

/**
 * Attempts to flush all queued writes for the given token against Google Sheets.
 * Successfully written items are removed. Items that fail are kept and their
 * attempt count is incremented. Items that exceed MAX_ATTEMPTS are discarded.
 *
 * @returns number of items successfully flushed
 */
export async function flushQueue(
  token: string,
  spreadsheetId: string
): Promise<number> {
  const items = queue.get(token) ?? [];
  if (items.length === 0) return 0;

  const remaining: QueuedWrite[] = [];
  let flushed = 0;

  for (const item of items) {
    try {
      await flushQueuedWrite(token, spreadsheetId, item);
      flushed += 1;
    } catch (error) {
      const nextAttempts = item.attempts + 1;
      if (nextAttempts < MAX_ATTEMPTS) {
        remaining.push({ ...item, attempts: nextAttempts });
      } else {
        console.warn(`[queueService] Discarding item ${item.id} after ${MAX_ATTEMPTS} failed attempts`);
      }
    }
  }

  if (remaining.length > 0) {
    queue.set(token, remaining);
  } else {
    queue.delete(token);
  }

  return flushed;
}
