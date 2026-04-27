import socket from 'socket.io-client';


let socketInstance = null;


export const initializeSocket = (projectId) => {
    socketInstance = io(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        }
    });

    socketInstance.on('connect', () => {
        socketInstance.emit('join-project', { projectId });  // <-- wrap in object
    });

    return socketInstance;
};
