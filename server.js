const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter');
const { saveUserInfo, getUsersFromTheRoom, deleteUserInfo } = require('./utils/save-user-information')

const io = require('socket.io')(httpServer);


const PORT = 5500

const Messenger = require('./public/models/message-schema');
const dbConnection = require('./public/config/db-connection');
const mongoose = require('mongoose');

const cors = require('cors')

app.use(express.static(path.join(__dirname, 'public')))
// a middleware to enable CORS.
app.use(cors());

dbConnection()
let messageInfo = {};
io.on('connection', socket => {
    socket.on('send-username-and-roomtype', (userInfo) => {
        // save the user info
        let user = saveUserInfo(socket.id, userInfo.userName, userInfo.roomType);
        // redirect user to the corresponding chat room, based on their choice.
        socket.join(user.roomType);
        // show welcome message to all users no matter which chat room they joined.
        socket.emit('welcome-message', messageFormatter('', user.roomType, ''));
        // notify all other users in the specific chat room on who has joined that room.
        socket.broadcast.to(user.roomType).emit('welcome-notification-to-all-others', messageFormatter(' has joined the ', user.roomType, user.userName));

        socket.emit('list-of-users-in-the-room', getUsersFromTheRoom(user.userId, user.roomType));
        // only allow communications if users are in the same chat room.
    
        socket.on('user-typed-message', (message) => {

        // save the user sent messages to the db, along with other user information.
        Messenger.create({ userName: user.userName, message: message, roomType: user.roomType, date: user.time}, function(err, doc) {
            if(err) {
                console.log('Failed to insert data.');
            }
            // after creating the document with the provided messsage info in the db, get its unique document id, parse it with other info, and send it back to the sender
            // and all other users.
            setMessage(doc.id, message).then(
                socket.to(user.roomType).emit('send-back-user-typed-message', messageFormatter(message, user.roomType, user.userName, messageInfo.messageId)),
                socket.emit('send-back-user-typed-message-to-self', messageFormatter(message, user.roomType, user.userName, messageInfo.messageId)))
            })
        })
        

        app.delete('/message/delete/:id', (req, res) => {
  
            let messageId = req.params.id;
            Messenger.deleteOne({ _id: messageId }, function(err, doc) {
            if(err) {
                console.log("failed to delete the messages!");
            } 
                res.send(doc);
            })

        })
        
        socket.on('removed-message', (removedMessageId) => {
            socket.broadcast.to(user.roomType).emit('send-back-removed-message', removedMessageId);
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(user.roomType).emit('user-disconnected', messageFormatter('', user.roomType, user.userName, ''));
            deleteUserInfo(user.userId);
        })

        app.get('/messages', (req, res) => {
            Messenger.find({ userName: user.userName }, function(err, doc) {
            if(err) {
                console.log('Failed to get the messages');
            }
                res.send(doc);
            })
        })
    
    })
});

httpServer.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
});

async function setMessage(messageId, message) {
    messageInfo.messageId = messageId;
    messageInfo.messageContent = message;

    return messageInfo;
}