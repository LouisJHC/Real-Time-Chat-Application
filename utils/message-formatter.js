const moment = require('moment')
const messageFormatter = (message, userName) => {
    return ({
        message,
        userName,
        time: moment().format()
    })
}

module.exports = messageFormatter