const express = require('express');
const router = express.Router();
const bcrpyt = require('bcryptjs')
const Messenger = require('../../models/message-schema');
const passport = require('passport');

router.get('/signin', (req, res) => res.render('sign-in'));
router.get('/signup', (req, res) => res.render('sign-up'));

router.post('/signup', (req, res) => {
    let errorMessages = [];

    const { userName, email, password, passwordConfirm } = req.body;

    if(password === 'password') {
        errorMessages.push( { error: 'Password can\'t be passsword.' });
    }

    if(password.length <= 8) {
        errorMessages.push( { error: 'Password must be longer than 8 characters.'});
    }

    if(password.length >= 16) {
        errorMessages.push( { error: 'Password must be shorter than 16 characters.'});
    }

    if(password != passwordConfirm) {
        errorMessages.push( { error: 'Passwords don\'t match.'});
    }

    if(errorMessages.length > 0) {
        res.render('sign-up', {
            errorMessages
        })
    } else {
        // if the email already exists in the db, re-render the sign up page.
        Messenger.findOne( { email: email }).then(user => {
            if(user) {
                errorMessages.push( { error: 'The user already exists.' });
                res.render('sign-up', {
                    errorMessages
                });
            } else {
                // hash the password before I insert the user document into the db.
                bcrpyt.genSalt(10, function(err, salt) {
                    bcrpyt.hash(password, salt, function(err, hash) {
                        Messenger.create({ userName, email, password: hash }, function(err,doc) {
                            if(err) console.log(err);
                        });
                    })
                })
                req.flash('successMessage', 'You are now successfully registered.');
                res.redirect('/user/signin')
            }
        }).catch(err => console.log(err));
    } 
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/chat',
        failureRedirect: '/user/signin',
        failureFlash: true
})(req, res, next);
})

router.get('/signout', (req, res) => {
    req.logout();
    req.flash('successMessage', 'You are not logged out.');
    res.redirect('/user/signin');   
})
// serializeUser returns a unique user identifier. Here, user is saved in the session, and it is retrieved with deserializeUser() below.
passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((id, done) => {
    Messenger.findById(id, (err, user) => {
      done(err, user);
    });
  });

module.exports = router;