const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter');
const { saveUserInfo, getUsersFromTheRoom, deleteUserInfo } = require('./utils/save-user-information')

const io = require('socket.io')(httpServer);

const Messenger = require('./public/models/message-schema');
const dbConnection = require('./public/config/db-connection');
const mongoose = require('mongoose');

const cors = require('cors')

const PORT = 3000

app.use(express.static(path.join(__dirname, 'public')))
// a middleware to enable CORS.
app.use(cors());
io.on('connection', socket => {
    socket.on('send-username-and-roomtype', (userInfo) => {
        // save the user info
        const user = saveUserInfo(socket.id, userInfo.userName, userInfo.roomType);

        // redirect user to the corresponding chat room, based on their choice.
        socket.join(user.roomType);
        // show welcome message to all users no matter which chat room they joined.
        socket.emit('welcome-message', messageFormatter('', user.roomType, ''));
        // notify all other users in the specific chat room on who has joined that room.
        socket.broadcast.to(user.roomType).emit('welcome-notification-to-all-others', messageFormatter(' has joined the ', user.roomType, user.userName));

        // only allow communications if users are in the same chat room.
        socket.on('user-typed-message', (message) => {
            let messageToBeSaved = new Messenger( {
                userName: user.userName,
                message: message,
                roomType: user.roomType,
                date: user.time
            });

            Messenger.find({ userName: user.userName}, function(err, doc) {
                // if there is no match, create a new document and add it to the collection.
                if(JSON.stringify(doc) === JSON.stringify([])) {
                    console.log('create a new document.');
                    Messenger.create({ userName: user.userName, message: message, roomType: user.roomType, date: user.time});
                // else, update.
                } else {
                    console.log("update a document.");
                    Messenger.update({ userName: user.userName}, {
                        $set: {
                            message: message,
                            roomType: user.roomType,
                            date: user.time
                    }}, function(err, doc) {
                        console.log(doc);
                    }
                    )
                }
            })

            socket.broadcast.to(user.roomType).emit('user-typed-message-send-back', messageFormatter(message, user.roomType, user.userName));
        })
        socket.emit('list-of-users-in-the-room', getUsersFromTheRoom(user.userId, user.roomType));

        socket.on('disconnect', () => {
            deleteUserInfo(user.userId);
            socket.emit('list-of-users-in-the-room', getUsersFromTheRoom(user.userId, user.roomType));
            socket.broadcast.to(user.roomType).emit('user-disconnected', messageFormatter('', user.roomType, user.userName));
        })


        dbConnection().then(db => {
            console.log('connected to db!');
        })

        function getDocuments(name, query, callback) {
            mongoose.connection.db.collection(name, function(err, item) {
                item.find({ message: 'hi'}).toArray(callback);
            })
        }

    }) 
})

httpServer.listen(PORT, () => {
    console.log("Server is running at port 3000")
});


