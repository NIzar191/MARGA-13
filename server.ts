import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const PORT = 3000;

  // Track online users per circle
  // Mapping: circleId -> Set of active user IDs
  const activeUsers = new Map<string, Set<string>>();
  // Mapping: socketId -> { circleId, userId }
  const socketToUser = new Map<string, { circleId: string; userId: string }>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-circle', ({ circleId, userId }) => {
      socket.join(circleId);
      
      if (!activeUsers.has(circleId)) {
        activeUsers.set(circleId, new Set());
      }
      activeUsers.get(circleId)?.add(userId);
      socketToUser.set(socket.id, { circleId, userId });

      // Broadcast updated list to the circle
      io.to(circleId).emit('presence-update', Array.from(activeUsers.get(circleId) || []));
    });

    socket.on('disconnect', () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { circleId, userId } = userInfo;
        activeUsers.get(circleId)?.delete(userId);
        socketToUser.delete(socket.id);
        
        io.to(circleId).emit('presence-update', Array.from(activeUsers.get(circleId) || []));
      }
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
