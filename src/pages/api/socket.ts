import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { getRedisConnection } from '@/lib/redis/redis';
import Redis from 'ioredis';

export const config = {
  api: {
    bodyParser: false,
  },
};

let redisSubscriber: Redis | null = null;

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    console.log('[SOCKET_INITIALIZATION] First use, starting socket.io...');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    // 1. Setup Redis Subscriber for Cross-process communication
    if (!redisSubscriber) {
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisHost = process.env.REDIS_HOST || '127.0.0.1';
      redisSubscriber = new Redis({
        host: redisHost,
        port: redisPort,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      redisSubscriber.subscribe('live-notifications', 'stock-updates', (err) => {
        if (err) console.error('[SOCKET_REDIS] Failed to subscribe:', err.message);
        else console.log('[SOCKET_REDIS] Subscribed to live channels.');
      });

      redisSubscriber.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message);
          if (channel === 'live-notifications') {
            // Emit to specific user room if userId is present, otherwise broadcast
            if (data.userId) {
              io.to(`user:${data.userId}`).emit('notification', data);
            } else {
              io.emit('notification', data);
            }
          } else if (channel === 'stock-updates') {
            io.emit('stock-update', data);
          }
        } catch (e) {
          console.error('[SOCKET_REDIS] Parse error:', e);
        }
      });
    }

    io.on('connection', (socket) => {
      console.log('[SOCKET] Client connected:', socket.id);

      // User room for targeted notifications
      socket.on('join-user', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] User ${userId} joined their personal room.`);
      });

      socket.on('join-chat', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`[SOCKET] Socket ${socket.id} joined chat:${chatId}`);
      });

      socket.on('send-message', (data) => {
        io.to(`chat:${data.chatId}`).emit('new-message', data);
      });

      socket.on('disconnect', () => {
        console.log('[SOCKET] Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
