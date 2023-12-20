if(process.env.NODE_ENV !== "production"){
   require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Campground = require('./models/campground')
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash')
// const flash = require('express-flash')
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require ('./models/user.js')


//routes-------
const userRoutes = require('./routes/users')

//-------------


//imported midddleware---------
const {isLoggedIn} = require('./middleware')

//--------------
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connected');
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'secret'

const store = MongoStore.create({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60
})

//Configuring our application to store the session information using mongo.
store.on("error", function(e){
  console.log("Session store error", e)
})

const sessionConfig = {
  store, //store: store
  secret,
  resave: false,
  saveUninitialized: true,
}

app.use(session(sessionConfig));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session()); // app.use session should be there before passport.session
passport.use(new LocalStrategy(User.authenticate()))// in here, we need to have our User model.

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.use ((req,res,next) => {
  console.log(req.session)
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  next();
})
// -----Route for testing purposes-----

app.get('/fakeUser', async (req,res) => {
  const user = new User ({
    email: 'fluff@gmail.com',
    username: 'fluffy'
  })
  const newUser = await User.register(user, 'chicken')//user.register takes the entire instance of the user model and then a password which will be hashed 
  res.send(newUser)

})

// app.get('/showFakeUser', async (req,res) =>{
//    const showUser = await User.find({})
//    res.send(showUser)
// });




//routes----------
app.use('/', userRoutes);



app.get('/', (req, res) => {
  res.render('home');
});

app.get('/campgrounds', async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render('campgrounds/index', { campgrounds });
});




// app.get('/campgrounds/new', async (req, res) => {
//   if (req.isAuthenticated()) {
//     res.render('campgrounds/new');
//   } 
//   else {
//     req.flash('error', 'you must be signed in')
//     return res.redirect('/login');
//   }

// });

// Colt's code-----------------------
app.get('/campgrounds/new', isLoggedIn, (req, res) => {
  res.render('campgrounds/new');
});




app.post('/campgrounds', async (req, res) => {
  const campground = new Campground(req.body.campground);
  await campground.save();
  req.flash('success', 'Successfully made a new campground!')
  res.redirect(`/campgrounds/${campground.id}`);
});

app.get('/campgrounds/:id', async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  res.render('campgrounds/show', { campground });
});

app.get('/campgrounds/:id/edit', isLoggedIn, async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  res.render('campgrounds/edit', { campground });
});

app.put('/campgrounds/:id', async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(
    id,
    { ...req.body.campground },
    { new: true }
  );
  res.redirect(`/campgrounds/${campground._id}`);
});

app.delete('/campgrounds/:id', async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect('/campgrounds');
});





const port = process.env.PORT || 2000;
app.listen(port, () => {
    console.log(`On Port ${port}`)
})