const express = require('express');
const router = express.Router();

router.get('/index', (req, res) => res.render('index'));
router.get('/signin', (req, res) => res.render('sign-in'));
router.get('/signup', (req, res) => res.render('sign-up'));

router.post('/signup', (req, res) => {
    res.send('welcome!');
})
module.exports = router;