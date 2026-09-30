import { TaskModel } from '../models/Task';
import { TaskPriority, TaskStatus } from '../types/task';
import { CreateTaskInput, UpdateTaskInput } from '../utils/validate';

// Sort strategy (documented in docs/ARCHITECTURE.md):
//  1. pending before completed (completed sink to bottom)
//  2. overdue / sooner deadline first (null deadlines last)
//  3. priority high > medium > low
//  4. newest createdAt first (stable tiebreak)
const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.HIGH]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.LOW]: 2,
};

interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

// All queries are ALWAYS scoped by userId (derived from verified token).
export async function listTasks(
  userId: string,
  filter: TaskFilter,
  sort?: string,
  order: 'asc' | 'desc' = 'asc',
) {
  const query: Record<string, unknown> = { userId };
  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.search) {
    const rx = new RegExp(filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: rx }, { description: rx }];
  }

  // Explicit sort modes for the bonus sorting UI; default = smart sort below.
  if (sort === 'priority') {
    const tasks = await TaskModel.find(query).sort({ createdAt: -1 }).lean();
    const dir = order === 'desc' ? -1 : 1;
    return tasks.sort(
      (a, b) => (PRIORITY_RANK[a.priority as TaskPriority] - PRIORITY_RANK[b.priority as TaskPriority]) * dir,
    );
  }
  if (sort === 'deadline' || sort === 'scheduledAt' || sort === 'createdAt') {
    const dir = order === 'desc' ? -1 : 1;
    return TaskModel.find(query).sort({ [sort]: dir }).lean();
  }

  const tasks = await TaskModel.find(query).sort({ createdAt: -1 }).lean();
  return tasks.sort((a, b) => {
    // 1. status
    if (a.status !== b.status) return a.status === TaskStatus.PENDING ? -1 : 1;
    // 2. deadline (nulls last)
    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    // 3. priority
    const pa = PRIORITY_RANK[a.priority as TaskPriority] ?? 99;
    const pb = PRIORITY_RANK[b.priority as TaskPriority] ?? 99;
    if (pa !== pb) return pa - pb;
    // 4. createdAt desc already applied; keep stable
    return 0;
  });
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const doc = await TaskModel.create({
    userId,
    title: input.title,
    description: input.description ?? '',
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    deadline: input.deadline ? new Date(input.deadline) : undefined,
    priority: input.priority ?? TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
  });
  return doc.toObject();
}

export async function getTask(userId: string, id: string) {
  // Ownership enforced in the query itself: { _id, userId }.
  return TaskModel.findOne({ _id: id, userId }).lean();
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  const patch: Record<string, unknown> = { ...input };
  if (input.scheduledAt !== undefined)
    patch.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (input.deadline !== undefined)
    patch.deadline = input.deadline ? new Date(input.deadline) : null;
  return TaskModel.findOneAndUpdate({ _id: id, userId }, patch, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function deleteTask(userId: string, id: string) {
  return TaskModel.findOneAndDelete({ _id: id, userId }).lean();
}
