const LocalStrategy = require('passport-local').Strategy;
const Messenger = require('../models/message-schema');
const bcrypt = require('bcryptjs');

// passport will be passed from the server side when requiring this module.
const passportFunc = (passport) => {
    passport.use(new LocalStrategy(
        { usernameField: 'email' }, (email, password, done) => {
            Messenger.findOne( { email: email }, (err, user) => {
                if(err) return done(err);
                if(!user) {
                    return done(null, false, { message: 'The user does not exist.' });
                }
                if(user) {
                    // if user exists, check whether the password matches.
                    bcrypt.compare(password, user.password, (err, success) => {
                        if(err) return done(err);
                        if(!success) {
                            return done(null, false, { message: 'The password is wrong.'});
                        }
                        if(success) {
                            return done(null, user);    
                        }
                    })
                }
            })
         })
    )}
module.exports = passportFunc;
