import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as service from '../services/taskService';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '../utils/validate';

// Controllers are thin: parse/validate input → call service → shape response.
// req.user.uid comes from the verified Firebase token (auth middleware).
function requireUid(req: AuthenticatedRequest): string {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return req.user.uid;
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const uid = requireUid(req);
  const q = taskQuerySchema.parse(req.query);
  const tasks = await service.listTasks(uid, q, q.sort, q.order ?? 'asc');
  res.json({ data: tasks });
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const uid = requireUid(req);
  const input = createTaskSchema.parse(req.body);
  const task = await service.createTask(uid, input);
  res.status(201).json({ data: task });
}

export async function getOne(req: AuthenticatedRequest, res: Response) {
  const uid = requireUid(req);
  const task = await service.getTask(uid, req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  res.json({ data: task });
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const uid = requireUid(req);
  const input = updateTaskSchema.parse(req.body);
  const task = await service.updateTask(uid, req.params.id, input);
  if (!task) {
    // Either doesn't exist OR belongs to another user — same 404 on purpose
    // so IDs can't be probed for other users' tasks.
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  res.json({ data: task });
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const uid = requireUid(req);
  const task = await service.deleteTask(uid, req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }
  res.json({ data: { id: req.params.id } });
}
