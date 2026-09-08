import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/api';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app;
