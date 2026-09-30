import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { taskApi } from '../services/taskApi';
import { getIdToken } from '../services/authToken';
import { CreateTaskPayload, TaskDto, TaskStatus } from '../types/task';

interface TasksState {
  items: TaskDto[];
  loading: boolean;
  error: string | null;
  filter: 'all' | TaskStatus;
  search: string;
}

const initialState: TasksState = {
  items: [],
  loading: false,
  error: null,
  filter: 'all',
  search: '',
};

function requireToken(): string {
  const token = getIdToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}

export const fetchTasks = createAsyncThunk('tasks/fetch', async () => {
  return taskApi.list(requireToken());
});

export const addTask = createAsyncThunk('tasks/add', async (payload: CreateTaskPayload) => {
  return taskApi.create(requireToken(), payload);
});

export const toggleTask = createAsyncThunk(
  'tasks/toggle',
  async ({ id, status }: { id: string; status: TaskStatus }) => {
    const next = status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    return taskApi.update(requireToken(), id, { status: next });
  },
);

export const removeTask = createAsyncThunk('tasks/remove', async (id: string) => {
  await taskApi.remove(requireToken(), id);
  return id;
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<TasksState['filter']>) {
      state.filter = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: TasksState) => {
      state.loading = true;
      state.error = null;
    };
    const failed = (state: TasksState, action: { error: { message?: string } }) => {
      state.loading = false;
      state.error = action.error.message ?? 'Something went wrong';
    };
    builder
      .addCase(fetchTasks.pending, pending)
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, failed)
      .addCase(addTask.pending, pending)
      .addCase(addTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addTask.rejected, failed)
      .addCase(toggleTask.fulfilled, (state, action) => {
        state.items = state.items.map((t) => (t._id === action.payload._id ? action.payload : t));
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      });
  },
});

export const { setFilter, setSearch, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
