const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const messageSchema = new Schema(
    {   
        userName: {
            type: String
        },
        message: {
            type: String
        },
        roomType: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now
        }
    });

let Messenger = mongoose.model("ChatLog", messageSchema);
module.exports = Messenger;