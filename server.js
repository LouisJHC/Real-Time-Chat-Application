const express = require('express');
const app = express();

const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);

const io = require('socket.io')(httpServer);


const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {
    socket.emit('welcome-message', 'Welcome!');
    socket.on("send-message", (message) => {
        console.log("Server listening: " + message.message);
        socket.emit("send-back-message", message.message);
    })

    socket.on('user-typed-message', (message) => {
        socket.emit('user-typed-message-send-back', message);
    })
})
httpServer.listen(PORT, () => {
    console.log("Server is running at port 3000")
});