const express = require('express');
const router = express.Router();


router.get('/index', (req, res) => res.render('index'));
router.get('/signin', (req, res) => res.render('sign-in'));
router.get('/signup', (req, res) => res.render('sign-up'));

router.post('/signup', (req, res) => {
    let errorMessages = [];

    const { name, email, password, passwordConfirm } = req.body;

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
        res.send('Validated');
    } 
});
module.exports = router;