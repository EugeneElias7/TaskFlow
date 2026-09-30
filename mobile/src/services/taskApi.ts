import { TaskDto, TaskPriority, TaskStatus } from '../types/task';

// React Native has no Node-style process.env — keep this a plain constant.
// Emulator → host PC: 'http://10.0.2.2:5000'. Physical device: your PC's LAN IP.
const API_URL = 'http://10.0.2.2:5000';

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? 'Request failed');
  return (body as { data: T }).data;
}

export const taskApi = {
  list: (token: string, params = '') => request<TaskDto[]>(`/api/tasks${params}`, token),
  create: (token: string, payload: unknown) =>
    request<TaskDto>('/api/tasks', token, { method: 'POST', body: JSON.stringify(payload) }),
  update: (token: string, id: string, payload: unknown) =>
    request<TaskDto>(`/api/tasks/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (token: string, id: string) =>
    request<{ id: string }>(`/api/tasks/${id}`, token, { method: 'DELETE' }),
};

export { TaskStatus, TaskPriority };
