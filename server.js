const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();


// Connect to the database
mongoose.connect('mongodb://0.0.0.0/basket-api', { useNewUrlParser: true });

// Create a schema for meals
const mealSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String
});

// Create a model for meals
const Meal = mongoose.model('Meal', mealSchema);

// Create a schema for baskets
const basketSchema = new mongoose.Schema({
  meals: [mealSchema]
});

// Create a model for baskets
const Basket = mongoose.model('Basket', basketSchema);

// Create a schema for user
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  basket: basketSchema
});

// Create a model for user
const User = mongoose.model('user', userSchema);

function generateAccessTocken(user){
  return jwt.sign(user.toJSON (), process.env.ACCES_TOKEN_SECRET, {expiresIn: '1800s'});
}

function authenticateToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, user) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Create an instance of the Express app
const app = express();

// Set the JSON parser for the app
app.use(express.json());

// GET route for fetching all baskets
app.get('/api/basket', authenticateToken,(req, res) => {  
  User.find((err, users) => {
    if (err) return console.error(err);
      const baskets = users.map(user => user.basket);
      res.send(baskets)
  });
});

// POST route for adding a meal to a basket
app.post('/basket/user/meals', authenticateToken,(req, res) => {
  const meal = new Meal(req.body);
  req.user.basket.meals.push(meal) ;

  User.findByIdAndUpdate(req.user._id , req.user, (err, user) => {
    if (err) return console.error(err);
    res.send(user);
  });
});

// DELETE route for delete a meal to a basket
app.delete('/meal/:id', authenticateToken, (req, res) =>{
  Meal.findByIdAndDelete(req.params.id, (err, meal)=>{
    if (err) return console.error(err);
    
    User.find((err, users) => {
      if (err) return console.error(err);
      console.log(users);
        users.forEach(user => {
          user.basket.meals.forEach( meal =>{
            if(meal._id == req.params.id){
              user.basket.remove(meal);
              User.findByIdAndUpdate(user._id , user, (err, userUpdate) => {
                if (err) return console.error(err);
                console.log(userUpdate);
              });            
            }
          }
          )
        });
    });

    res.send(meal);
  })
});

// DELETE route for delete all meal
app.delete('/basket/user/meals/', authenticateToken, (req, res) =>{
  Meal.deleteMany((err, meal)=>{
    if (err) return console.error(err);
    res.send(meal);
  })
});
  
// POST route for adding a meal to a basket with a id meal
app.post('/basket/user/meal/:id', authenticateToken,(req, res) => {
  Meal.findById(req.params.id, (err, meal) => {
    if (err) return console.error(err);
    req.user.basket.meals.push(meal) ;
    console.log(req.user.basket.meals);
    User.findByIdAndUpdate(req.user._id , req.user, (err, user) => {
      if (err) return console.error(err);
      console.log(user);
      res.send(user);
    });
  });
});

// Delete route for delete a meal to a basket with a id meal
app.delete('/basket/user/meal/:id', authenticateToken,(req, res) => {
  Meal.findById(req.params.id, (err, meal) => {
    if (err) return console.error(err);
    User.findById(req.user._id, (err, user) =>{
      if (err) return console.error(err);
      user.basket.meals.remove(meal);
      User.findByIdAndUpdate(user._id, user, (err, savedUser) => {
        if (err) return console.error(err);
        res.send(savedUser);
      });
    })
  });
});

// Route du login
app.post("/api/login", (req, res) => { 
  User.findOne({email: req.body.email }, (err, utilisateur) => {
    console.log(utilisateur);
    if (err) return console.error(err);     
    if(utilisateur == null) return res.sendStatus(404);
    if(utilisateur.password != req.body.password) return res.sendStatus(403);
    const accessToken = generateAccessTocken(utilisateur);
    res.json({accessToken: accessToken});
  });
});

//Création d'un utilisateur
app.post("/api/user", (req, res) => {
  var userToSave = new User(req.body);
  userToSave.basket = new Basket();
  userToSave.save((err, savedUser) => {
    if (err) return console.error(err);
    res.send(savedUser);
  });
});

// Affichage de tout les utilisateurs
app.get("/api/user", authenticateToken,(req, res) => {
  User.find((err, users) => {
    if (err) return console.error(err);
      res.send(users);
  });
});

// Supprime tout les user
app.delete("/api/user", authenticateToken,(req, res) => {
  User.deleteMany((err, users) => {
    if (err) return console.error(err);
      res.send(users);
  });
});

// Delete un user
app.delete("/api/user/:id", authenticateToken, (req, res) => {
  User.findOneAndDelete(req.params.id, (err, user) =>{
    if(err) return console.error(err);
    res.send(user);
  })
})

// Affiche l'utilisateur connecte
app.get("/api/user/me", authenticateToken, (req, res) => {
  User.findById(req.user._id, (err, user)=>{
    if(err) return console.error(err);
    res.send(user);
  })
});

// Get route pour le panier du user
app.get('/api/user/basket', authenticateToken,(req, res) => {
  User.findById(req.user._id, (err, user)=>{
    if(err) return console.error(err);
    res.send(user.basket);
  })
});

// Post route creer un meal
app.post('/api/meal', authenticateToken,(req, res) => {
  const meal = new Meal(req.body);
  meal.save((err, savedMeal) => {
    if (err) return console.error(err);
    res.send(savedMeal);
  });
});

// GET affiche tout les meals
app.get('/api/meals',(req, res) => { 
  Meal.find((err, meals) => {
    if (err) return console.error(err);
      res.send(meals)
  });
});
  
// Start the server
app.listen(3000, () => {
  console.log('API listening on port 3000');
});
