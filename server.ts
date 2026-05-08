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
  // Mapping: circleId -> Map of userId -> count of active sockets
  const circleUserCounts = new Map<string, Map<string, number>>();
  // Mapping: socketId -> { circleId, userId }
  const socketToUser = new Map<string, { circleId: string; userId: string }>();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-circle', ({ circleId, userId }) => {
      if (!circleId || !userId) return;
      
      socket.join(circleId);
      
      if (!circleUserCounts.has(circleId)) {
        circleUserCounts.set(circleId, new Map());
      }
      
      const userCounts = circleUserCounts.get(circleId)!;
      userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
      
      socketToUser.set(socket.id, { circleId, userId });

      // Broadcast updated list to the circle (only IDs with count > 0)
      const onlineIds = Array.from(userCounts.entries())
        .filter(([_, count]) => count > 0)
        .map(([id, _]) => id);
      
      io.to(circleId).emit('presence-update', onlineIds);
    });

    socket.on('disconnect', () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { circleId, userId } = userInfo;
        const userCounts = circleUserCounts.get(circleId);
        
        if (userCounts) {
          const currentCount = userCounts.get(userId) || 0;
          if (currentCount <= 1) {
            userCounts.delete(userId);
          } else {
            userCounts.set(userId, currentCount - 1);
          }
          
          const onlineIds = Array.from(userCounts.entries())
            .filter(([_, count]) => count > 0)
            .map(([id, _]) => id);
            
          io.to(circleId).emit('presence-update', onlineIds);
        }
        
        socketToUser.delete(socket.id);
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
