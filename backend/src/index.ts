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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allAllowedOrigins.indexOf(normalizedOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middleware
// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, "")); // Remove trailing slash

const additionalOrigins = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003"
];

const allAllowedOrigins = [...allowedOrigins, ...additionalOrigins];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Normalize the incoming origin just in case (though browsers usually don't send trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allAllowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin); // Helpful for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
