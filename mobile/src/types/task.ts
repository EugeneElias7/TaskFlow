// Shared task types — mirrors backend/src/types/task.ts.
// The mobile app treats API responses as TaskDto and never invents a userId;
// ownership lives on the backend (derived from the verified Firebase token).

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

export interface CreateTaskPayload {
  title: string;
  description?: string;
  scheduledAt?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
}
