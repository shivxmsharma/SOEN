import 'dotenv/config.js';
import http from 'http';
import app from './app.js';
import projectRoutes from './routes/project.routes.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult, generateContentStream } from './services/ai.service.js';

const port = process.env.PORT || 3000;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});


io.use(async (socket, next) => {
    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

        const projectId = socket.handshake.query.projectId;

        if(!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid project ID'));
        }

        socket.project = await projectModel.findById(projectId);

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        socket.user = decoded;
        next();

    } catch (error) {
        next(error);
    }
})
    

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();

    console.log('A user connected');

    socket.join(socket.roomId);


    socket.on('project-message', async data => {

        const message = data.message;
        
        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data); 

        if (aiIsPresentInMessage) {

            const prompt = message.replace('@ai', '');

            const resultStream = await generateContentStream(prompt);
            let fullResult = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                fullResult += chunkText;

                io.to(socket.roomId).emit('ai-response-chunk', {
                    chunk: chunkText,
                    sender: {
                        _id: 'ai',
                        email: 'AI Assistant',
                    }
                });
            }

            io.to(socket.roomId).emit('project-message', {
                message: fullResult,
                sender: {
                    _id: 'ai',
                    email: 'AI Assistant',
                }
            });

            return;
        }

        socket.on('project-update', async data => {
            const projectId = data.projectId;
            const fileTree = data.fileTree;

            await projectModel.findByIdAndUpdate(projectId, {
                fileTree
            });

            socket.to(socket.roomId).emit('project-update', data);
        });

        
    });

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        socket.leave(socket.roomId);
    });
});


app.use('/projects', projectRoutes);


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})