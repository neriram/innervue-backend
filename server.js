// required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
// for logging
const toolbox = require('./private/toolbox');
const chalk = require('chalk');
const rowdy = require('rowdy-logger');

// app setup and middlewares
const app = express();
const rowdyResults = rowdy.begin(app);

// Bodyparser middlewares
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// private modules/middlwares
app.use(express.static(__dirname + '/private'));

// cors Middleware
app.use(cors());

// database setup af connection (options are to supress console warnings)
const mongooseOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useCreateIndex: true
};

// check node enviroment for database connection
if(process.env.NODE_ENV === 'development'){
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/innervuedb', mongooseOptions); 
} else {
  const MongoClient = require('mongodb').MongoClient;
  const uri = process.env.MONGOD_URI
  console.log(typeof uri)
  const client = new MongoClient(uri, { useNewUrlParser: true });
  client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
  });
  mongoose.connect(uri, mongooseOptions).then((() => console.log('MONGOOSE CONNECTED'))).catch(error => toolbox.logError(error))
}

const db = mongoose.connection;

db.once('open', () => {
  console.log(chalk.black.bgGreen(`Connected to MongoDB ${db.name} at ${db.host}:${db.port}`));
});

db.on('error', (error) => {
  toolbox.logError('in server.js', 'db.on()', error);
});

// test route
app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>')
});

// Passport Middleware
app.use(passport.initialize());

// Passport JWT Config
require('./config/passport')(passport);

// route controllers
app.use('/users', require('./controllers/users'));

// check for enviromenmtal variable errorssss
toolbox.envError();

// initialize app on port
const port = process.env.PORT || 3001;

app.listen(port, () => {
  rowdyResults.print();
  console.log(chalk.black.bgYellow(` ~~~listening on port: ${port}~~~ `)); 
});
