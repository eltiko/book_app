'use strict';
    // script-src ‘self’ http://xxxx ‘unsafe-inline’ ‘unsafe-eval’;

const express = require('express');
const superagent = require('superagent');
require('ejs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.static("./public"));

app.set('view engine', 'ejs');

//API Routes
app.get('/', newSearch);
app.post('/searches', searchForBooks);
app.use("*", notFound);
app.use(errorHandler);
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

//Error handling
function notFound(req, res) {
  res.status(404).send('Not Found');
}
function errorHandler(error, req, res) {
  res.status(500).send(error);
}
///=========================================================


function newSearch (req, res) {
  res.render('pages/index');
}
//Book constuctor 
function Book(info) {
  this.title = info.title || 'No title available';
  const placeholderImage = 'http://placehold.it/300x300';
  this.author = info.authors || 'Author(s) Not available';
}

function searchForBooks(req,res) {

  const thingUserSearchFor = req.body.search[0];
  const typeOfSearch =  req.body.search[1];

  let url = `https://www.googleapis.com/books/v1/volumes?q=`;

  if (typeOfSearch === "title") {
    url += `+intitle:${thingUserSearchFor}`;
  }
  if (typeOfSearch === "author") {
    url += `+inauthor:${thingUserSearchFor}`;
  }

  superagent
    .get(url)
    .then(apiResponse => apiResponse.body.items.map(result => new Book(result.volumeInfo)))
    .then( results => res.status(200).render("pages/searches/show", {searchResults: results}))
    .catch(error => errorHandler(error, req, res));

// .then(results => res.render('pages/searches/show', {searchResults: results}));

}

