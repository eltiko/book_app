'use strict';
require("dotenv").config();

const express = require('express');
const superagent = require('superagent');
const pg = require("pg");
require('ejs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on("error", err => console.error(err));
app.set('view engine', 'ejs');

//API Routes
app.get('/', getBooks);
app.get('/books/:book_id', getOneBook);
app.get('/searches', addABook);
app.post('/', searchForBooks);

app.use('*', notFound);
app.use(errorHandler);

//Error handling
function notFound(req, res) {
  res.status(404).render('pages/error');
}
function errorHandler(error, req, res) {
  res.status(500).render('pages/error');
}
///=========================================================
function getBooks(req,res) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then( results => res.render('pages/searches/show', {results: results.rows}))
    .catch(err => console.log(err));
}

function getOneBook(req,res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let searchValues = [req.params.book_id];

  return client.query(SQL, searchValues)
    .then( result => {
      return res.render('pages/detail-view', {book: result.row[0]});
    })
    .catch( err => console.log(err));
}


//Book constuctor 
function Book(info) {
  this.title = info.volumeInfo.title || 'No title available';
  this.book_id = info.id;
  this.image_url = `https://books.google.com/books?id=${info.book_id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
  this.author = info.volumeInfo.authors || 'Author(s) Not available';
  this.description = info.volumeInfo.description || 'Description Not available';
  this.isbn = info.volumeInfo.industryIdentifiers[0].identifier;
  this.bookshelf = bookshelf;
}
//Add a book to the DB
function addABook(req, res) {
  res.render("pages/index");
  console.log("addBooks()".req.body);
  let {book_id, title, author, isbn, image_url, description, bookshelf} = req.body;
  let SQL = "INSERT into books(book_id, title, author, isbn, image_url, description, bookshelf) VALUES ($1,$2,$3,$4,$5,$6,$7);";
  searchValues = [
    book_id,
    title,
    author,
    isbn,
    image_url,
    description,
    bookshelf
  ];

  return client
    .query(SQL, searchValues)
    .then(res.redirect('/'))
    .catch(err => console.log(err));
}

//search for books in DB or from Google
function searchForBooks(req,res) {
  
  const thingUserSearchFor = req.body.search[0];
  const typeOfSearch =  req.body.search[1];
  let ABC = `SELECT * FROM books WHERE title = ${thingUserSearchFor} `;
  client.query(ABC, thingUserSearchFor).then(result => {
    if(result.rowCount) {
      console.log('Book Found!')
      let book = new Book(thingUserSearchFo, result);
      res.status(200).redirect('/')
    } else {
      console.log('No Match Found')
        // let dataValue = [req.query.data];
        let url = `https://www.googleapis.com/books/v1/volumes?q=`;

        if (typeOfSearch === "title") {
          url += `+intitle:${thingUserSearchFor}`;
        }
        if (typeOfSearch === "author") {
          url += `+inauthor:${thingUserSearchFor}`;
        }

        superagent
          .get(url)
          .then(apiResponse => apiResponse.body.items.map(result => new Book(result)))
          .then(results =>
            res.status(200).render("pages/searches/show", { searchResults: results })
          )
          .catch(error => errorHandler(error, req, res));
          }
  })


}

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
