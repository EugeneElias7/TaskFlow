import { TaskPriority, TaskStatus } from '../types/task';

// Mirrors the backend smart-sort so the rule is unit-testable without a DB.
// See backend/src/services/taskService.ts for the authoritative implementation.
const RANK = { high: 0, medium: 1, low: 2 } as const;

interface Sortable {
  status: TaskStatus;
  deadline: string | Date | null;
  priority: TaskPriority;
  createdAt: string | Date;
}

export function smartSort<T extends Sortable>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === TaskStatus.PENDING ? -1 : 1;
    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    const pa = RANK[a.priority as keyof typeof RANK] ?? 99;
    const pb = RANK[b.priority as keyof typeof RANK] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

describe('task smart sort', () => {
  const base = {
    priority: TaskPriority.MEDIUM as TaskPriority,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  it('puts pending before completed', () => {
    const out = smartSort([
      { ...base, status: TaskStatus.COMPLETED, deadline: null },
      { ...base, status: TaskStatus.PENDING, deadline: null },
    ]);
    expect(out[0].status).toBe(TaskStatus.PENDING);
  });
  it('orders sooner deadlines first, nulls last', () => {
    const out = smartSort([
      { ...base, status: TaskStatus.PENDING, deadline: null },
      { ...base, status: TaskStatus.PENDING, deadline: '2026-12-31T00:00:00.000Z' },
      { ...base, status: TaskStatus.PENDING, deadline: '2026-01-02T00:00:00.000Z' },
    ]);
    expect(out.map((t) => t.deadline)).toEqual([
      '2026-01-02T00:00:00.000Z',
      '2026-12-31T00:00:00.000Z',
      null,
    ]);
  });
  it('breaks deadline ties by priority high > medium > low', () => {
    const out = smartSort([
      { ...base, status: TaskStatus.PENDING, deadline: null, priority: TaskPriority.LOW },
      { ...base, status: TaskStatus.PENDING, deadline: null, priority: TaskPriority.HIGH },
      { ...base, status: TaskStatus.PENDING, deadline: null, priority: TaskPriority.MEDIUM },
    ]);
    expect(out.map((t) => t.priority)).toEqual(['high', 'medium', 'low']);
  });
});
