module.exports = {
    checkIfAuthenticated: (req, res, next) => {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'You need to sign in to view this page.');
        res.redirect('/user/signin');
    }
}