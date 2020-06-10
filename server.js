const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const httpServer = http.createServer(app);
const messageFormatter = require('./utils/message-formatter');
const { saveUserInfo, getUsersFromTheRoom, deleteUserInfo } = require('./utils/save-user-information')
const io = require('socket.io')(httpServer);

// Express session set up with connect-flash to flash messages on redirect.
// In particular, express session is to store a user state.
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
require('./config/authenticate')(passport);


app.use(session({
    secret: 'session',
    resave: true,
    saveUninitialized: false
}));

app.use(flash());


// Passport middleware. These have to be put below the express session line above.
app.use(passport.initialize());
app.use(passport.session());

// Setting global variables, so I can have different colors for different messages (e.g. Blue for successful sign up and red for failed validation).
// Flash messages are stored in the sessions.
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('successMessage');
    res.locals.error = req.flash('error');
    next();
})


// ejs set up. app.use('layout') should come first.
app.use(require('express-ejs-layouts'));
app.set('view engine', 'ejs');

// DB configuration
const Messenger = require('./models/message-schema');
const dbConnection = require('./config/db-connection');
dbConnection()

// CORS 
const cors = require('cors')
app.use(cors());

// to get the form data with req.body. This line should come above the routing setup below.
app.use(express.urlencoded({ extended: false}));

app.get('/user-info', (req, res) => {
    // after serailizeUser is called, the result of calling that method is attached to the session, so I can access it using req.session.passport.user.
    if(typeof req.session.passport !== 'undefined') {
        res.send(req.session.passport.user.userName);
    }
})

app.use(express.static(path.join(__dirname, 'public')));


// Routing. The router should come after static line above, so that static files will handled first.
app.use('/user', require('./public/js/user'));

let messageInfo = {};
// Socket Communications
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

        socket.emit('current-user', user);

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
        
        // when the user deleted his/her messages in the chat box.
        socket.on('removed-message', (removedMessageId) => {
            // socket.broadcast.to(user.roomType).emit('send-back-removed-message', removedMessageId);
            io.to(user.roomType).emit('send-back-removed-message', removedMessageId);
        })

        // this is when the user deleted his/her messages from the pop-up that shows list of all messages they have sent so far.
        socket.on('removed-message-from-the-pop-up', (removedMessageId) => {
            socket.emit('send-back-removed-message-from-the-pop-up-to-self', removedMessageId);
        })
        socket.on('disconnect', () => {
            socket.broadcast.to(user.roomType).emit('user-disconnected', messageFormatter('', user.roomType, user.userName, ''));
            deleteUserInfo(user.userId);
        })

        // I am receiving the room type here as well, since the user messages in each chat room should be separate from each other.
        app.get('/message/:userName/:roomType', (req, res) => {
            let userName = req.params.userName;
            let roomType = req.params.roomType;
            Messenger.find({ userName: userName, roomType: roomType }, function(err, doc) {
            if(err) {
                console.log('Failed to get the messages');
            }
                res.send(doc);
            })
        })
    })
});

const PORT = 5500;
httpServer.listen(PORT, (req, res) => {
    console.log(`Server is running at ${PORT}`);
});


async function setMessage(messageId, message) {
    messageInfo.messageId = messageId;
    messageInfo.messageContent = message;

    return messageInfo;
}


