import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: any) => {
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io');
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('join-chat', (chatId) => {
                socket.join(`chat:${chatId}`);
                console.log(`Socket ${socket.id} joined chat:${chatId}`);
            });

            socket.on('send-message', (data) => {
                // Broadcast to everyone in the room
                io.to(`chat:${data.chatId}`).emit('new-message', data);
            });

            socket.on('typing', (data) => {
                // Broadcast typing status to room (except sender)
                socket.to(`chat:${data.chatId}`).emit('user-typing', data);
            });

            socket.on('stop-typing', (data) => {
                socket.to(`chat:${data.chatId}`).emit('user-stop-typing', data);
            });

            socket.on('mark-read', (data) => {
                socket.to(`chat:${data.chatId}`).emit('messages-read', data);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        res.socket.server.io = io;
    } else {
        console.log('socket.io already running');
    }
    res.end();
};

export default ioHandler;
