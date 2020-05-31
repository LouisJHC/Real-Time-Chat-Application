const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter');
const { saveUserInfo, getUsersFromTheRoom, deleteUserInfo, addMessageToTheList, getAllSavedMessages } = require('./utils/save-user-information')

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
            let result = setMessage(doc.id, message);
    
            result.then(addMessageToTheList(messageInfo).then(getAllSavedMessages()));
        })
    
 

       
        socket.broadcast.to(user.roomType).emit('user-typed-message-send-back', messageFormatter(message, user.roomType, user.userName));
        
        })

        app.delete('/messages/delete', (req, res) => {
            console.log(message);
            Messenger.deleteOne({ message: message }, function(err, doc) {
            if(err) {
                console.log("failed to delete the messages!");
            }
                console.log('deleted!');   
                res.send(doc);
            })
        })
        

        socket.on('disconnect', () => {
            deleteUserInfo(user.userId);
            socket.emit('list-of-users-in-the-room', getUsersFromTheRoom(user.userId, user.roomType));
            socket.broadcast.to(user.roomType).emit('user-disconnected', messageFormatter('', user.roomType, user.userName));
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
    messageInfo.messageContent =message;

    return messageInfo;
}