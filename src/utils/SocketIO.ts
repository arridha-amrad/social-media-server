import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../interfacesAndTypes/ISocketIO';

interface OnlineUser {
  username: string;
  socketId: string;
}

const onlineUsers: OnlineUser[] = [];

const addUser = (username: string, socketId: string) => {
  // username exists ? update socketId : create new
  const index = onlineUsers.findIndex((user) => user.username === username);
  if (index >= 0) {
    onlineUsers[index].socketId = socketId;
  } else {
    onlineUsers.push({ username, socketId });
  }
};

const removeUser = (socketId: string) => {
  return onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username: string) => {
  return onlineUsers.find((user) => user.username === username);
};

export const initializeSocketIO = (httpServer: HTTPServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
    },
  });

  io.on('connection', (socket) => {
    socket.on('addUser', (username) => {
      addUser(username, socket.id);
      console.log('addUsers : ', onlineUsers);
    });

    socket.on('addComment', (notification, toUsername) => {
      console.log('comment...');
      const user = getUser(toUsername);
      if (user) {
        io.to(user.socketId).emit('commentAlert', notification);
      }
    });

    socket.on('likeComment', (notification, toUsername) => {
      console.log('like comment...');
      const user = getUser(toUsername);
      if (user) {
        io.to(user.socketId).emit('likeCommentAlert', notification);
      }
    });

    socket.on('likePost', (notification, toUsername) => {
      console.log('like...');
      const user = getUser(toUsername);
      if (user) {
        io.to(user.socketId).emit('likeAlert', notification);
      }
    });

    socket.on('disconnect', () => {
      console.log('an user left');
      const users = removeUser(socket.id);
      console.log('remaining users : ', users);
    });
  });
};
