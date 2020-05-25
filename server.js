const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter.js');

const io = require('socket.io')(httpServer);


const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {
    socket.emit('welcome-message', messageFormatter('Welcome!', 'ChatBot'));
    socket.broadcast.emit('welcome-notification-to-all-others', messageFormatter('A User Joined the Chat!', 'ChatBot'));

    socket.on('user-typed-message', (message) => {
        socket.broadcast.emit('user-typed-message-send-back', messageFormatter(message, 'User'));
    })
})
httpServer.listen(PORT, () => {
    console.log("Server is running at port 3000")
});