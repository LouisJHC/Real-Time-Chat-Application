const moment = require('moment')
const messageFormatter = (message, roomType, userName, messageId) => {
    return ({
        message,
        userName,
        time: moment().format(),
        roomType,
        messageId
    })
}

module.exports = messageFormatter;