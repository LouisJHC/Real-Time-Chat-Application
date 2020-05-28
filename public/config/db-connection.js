const mongoose = require('mongoose');
const config = require('./config');
const dbConnectionString = config.dbConnectionString;

const dbConnection = async () => {
    try {
       await mongoose.connect(dbConnectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
}

dbConnection();
module.exports = dbConnection;
