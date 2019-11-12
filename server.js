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

//Error handling
function notFound(req, res) {
  res.status(404).render('pages/error');
}
function errorHandler(error, req, res) {
  res.status(500).render('pages/error');
}
///=========================================================


function newSearch (req, res) {
  res.render('pages/index');
}
//Book constuctor 
function Book(info) {
  this.title = info.title || 'No title available';
  this.placeholderImage = 'http://placehold.it/200x300';
  this.author = info.authors || 'Author(s) Not available';
  this.description = info.description || 'Description Not available';
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
