'use strict';

const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname + "/public"));

app.set('view engine', 'ejs');

//API Routes
// app.length('/', newSearch);
app.get('/hello', (req, res)  => {
  res.render('pages/index');
}) 

// app.post('/searches', createSearch);


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
