const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter');
const saveUserInfo = require('./utils/save-user-information')

const io = require('socket.io')(httpServer);


const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', socket => {
    socket.on('send-username-and-roomtype', (userInfo) => {
        // save the user info
        const user = saveUserInfo(socket.id, userInfo.userName, userInfo.roomType);

        // redirect user to the corresponding chat room, based on their choice.
        socket.join(user.roomType);
        socket.emit('welcome-message', messageFormatter('', user.roomType, ''));
        socket.broadcast.emit('welcome-notification-to-all-others', messageFormatter(' joined the ', user.roomType, user.userName));
    
    
    
        socket.on('user-typed-message', (message) => {
            socket.broadcast.emit('user-typed-message-send-back', messageFormatter(message, user.roomType, user.userName));
        })
    
    
    } )
  

   
})
httpServer.listen(PORT, () => {
    console.log("Server is running at port 3000")
});