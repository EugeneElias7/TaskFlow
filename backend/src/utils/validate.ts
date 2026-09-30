import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../types/task';

// LEARNING POINT: server-side validation with Zod. Client validation
// improves UX but can be bypassed, so the API re-validates everything.
// ISO datetime strings are accepted and converted to Date in the service.

const dateString = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  scheduledAt: dateString,
  deadline: dateString,
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  scheduledAt: dateString,
  deadline: dateString,
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const taskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['deadline', 'priority', 'scheduledAt', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
