import mongoose from 'mongoose';
import { TaskPriority, TaskStatus } from '../types/task';

// Mongoose schema = the enforced shape + validation for the MongoDB
// `tasks` collection. Every task belongs to exactly one Firebase user
// (userId = Firebase UID decoded from a verified ID token — never
// a client-supplied value).
const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // LEARNING POINT: indexed because EVERY query is scoped by userId
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    scheduledAt: { type: Date }, // optional "date/time" of the task
    deadline: { type: Date }, // optional due date (bonus: sorting/filtering)
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
  },
  { timestamps: true }, // adds createdAt + updatedAt automatically
);

// Compound index: a user's tasks sorted newest-first is the hot query.
taskSchema.index({ userId: 1, createdAt: -1 });

export const TaskModel = mongoose.model('Task', taskSchema);
