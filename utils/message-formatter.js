const moment = require('moment')
const messageFormatter = (message, roomType, userName) => {
    return ({
        message,
        userName,
        time: moment().format(),
        roomType
    })
}

module.exports = messageFormatter;