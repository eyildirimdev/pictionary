import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.get('/health', (_, res) => res.send('ok'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
  },
});

// lightweight in‑memory room state
const rooms = new Map<string, { currentWord: string }>();

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { currentWord: randomWord() });
    }
    socket.emit('word', rooms.get(roomId)!.currentWord);
  });

  socket.on('stroke', (payload) => {
    socket.to(payload.roomId).emit('stroke', payload);
  });

  socket.on('guess', ({ roomId, text }) => {
    const room = rooms.get(roomId);
    if (room && text.toLowerCase() === room.currentWord.toLowerCase()) {
      io.to(roomId).emit('correctGuess', text);
      room.currentWord = randomWord();
      io.to(roomId).emit('word', room.currentWord);
    } else {
      socket.to(roomId).emit('guess', text);
    }
  });

  socket.on('clear', ({ roomId }) => {
    io.to(roomId).emit('clear');
  });
});

httpServer.listen(PORT, () => console.log(`[server] listening on ${PORT}`));

const WORDS = ['apple', 'cat', 'house', 'tree', 'car', 'book', 'phone'];
function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}
