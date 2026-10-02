import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import 'express-async-errors';
import { connectDb } from './config/db';
import { initFirebaseAdmin } from './config/firebase';
import { errorHandler, notFound } from './middleware/errorHandler';
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/tasks', taskRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 5000);

async function main(): Promise<void> {
  initFirebaseAdmin();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (see backend/.env.example)');
  await connectDb(uri);
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`TaskFlow API listening on :${PORT}`);
  });
}

// Only auto-boot when run directly (so tests can import the app).
if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

export default app;