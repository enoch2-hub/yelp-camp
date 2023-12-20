const express = require('express');
const passport = require('passport');
const router = express.Router();
//creating a new user

//1- Making a basic user model instance where we pass in the user name and the email (not the password)
const User = require('../models/user');



router.get('/register', (req,res) => {
    res.render('users/register');
})
//2- Then we call user.register
// lets begin by destructurng what we want from req.body
router.post('/register', async  (req,res) => {
    try {
        const {username, email, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user,password);
        console.log(registeredUser);
        req.login(registeredUser, err => {
            if(err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp');
            res.redirect('/campgrounds')
        })
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/register')
    }
})

router.get('/login', (req,res) => {
    res.render('users/login')
})

router.post('/login', passport.authenticate('local', {failureFlash: true, keepSessionInfo: true, failureRedirect: '/login'}), (req,res) => {
    req.flash('success', 'welcome back!')
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})



//logout------------
router.get('/logout', (req, res, next) => {
    req.logout((e) => {
        if(e) {
            return next(e)
        } else {
            req.flash('error', 'You signed out')
            res.redirect('/campgrounds')
        }
    })
})





// router.get('/logout', (req, res, next) => {
//     req.logout();
//     res.flash('success', 'You logged out')
//     res.redirect('/campgrounds');
// })



module.exports = router;