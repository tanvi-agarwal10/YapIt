import express, { Express, Request, Response } from 'express';
import http from 'http';
import socketIO from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import { authenticateToken } from './middleware/auth';
import { setupSocketIO } from './socket/socketHandler';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: {
    origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow specific origins from environment or default
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
      const defaultOrigin = 'http://localhost:3000';
      
      if (allowedOrigins.length > 0 && allowedOrigins[0] !== '') {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // For development allow localhost
        if (origin.includes('localhost')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
      
      // Default behavior - allow localhost
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yapit';
mongoose
  .connect(mongoUri)
  .then(() => console.log('✓ MongoDB connected'))
  .catch((err) => console.error('✗ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'YapIt Backend is running', timestamp: new Date() });
});

// Socket.IO Setup
setupSocketIO(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ YapIt Backend running on http://localhost:${PORT}`);
});
