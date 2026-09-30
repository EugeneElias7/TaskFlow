// Shared backend task types (mirrored on mobile in mobile/src/types/task.ts).
// Keep both sides in sync; the API contract is JSON over REST.

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export interface TaskDto {
  _id: string;
  userId: string;
  title: string;
  description: string;
  scheduledAt: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}
