import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { initDb } from './db/database';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ciRoutes from './routes/ci';
import crRoutes from './routes/cr';
import approvalRoutes from './routes/approvals';
import baselineRoutes from './routes/baselines';
import statusRoutes from './routes/status';
import auditRoutes from './routes/audit';
import historyRoutes from './routes/history';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Initialize database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ci', ciRoutes);
app.use('/api/cr', crRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/baselines', baselineRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'CCB Control Center API' });
});

// Serve frontend build static assets
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Serve index.html for SPA routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CCB Control Center API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database: ${process.env.DB_PATH || './ccb.db'}`);
  });
}

export default app;
