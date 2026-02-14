import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './api/chat.routes';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
const PORT = process.env.PORT || 5000;

import visionRoutes from './api/vision.routes';
app.use('/api/vision', visionRoutes);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL // will be set on Render
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend server is running!' });
});

// Chat routes
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
});