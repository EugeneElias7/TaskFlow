import mongoose from 'mongoose';

// Fail-fast connection: one attempt, short timeout. If the database is
// unreachable you know instantly (crash with the real error) instead of
// waiting through retries — connect success = green light to proceed.
export async function connectDb(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
}
