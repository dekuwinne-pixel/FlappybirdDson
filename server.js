const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('.'));

let players = {};

io.on('connection', (socket) => {
    if (Object.keys(players).length >= 6) {
        socket.emit('full');
        socket.disconnect();
        return;
    }

    players[socket.id] = { y: 200 };
    io.emit('players', players);

    socket.on('position', (y) => {
        if (players[socket.id]) {
            players[socket.id].y = y;
            socket.broadcast.emit('players', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
    });
});

// ICI, tout à la fin, en dehors de tout
server.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});