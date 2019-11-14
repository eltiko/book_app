'use strict';
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
require('ejs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));//access request.body
app.use(express.static(__dirname + '/public'));

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));
app.set('view engine', 'ejs');

// //API Routes
app.get('/', getBooks);
app.post('/searches', searchForBooks); //add new book
app.get('/searches/new', getBookForm); //book search form

app.post('/books', createBook);
app.get('/books/:id', getOneBook);

app.use('*', notFound);
app.use(errorHandler);

// Error handling
function notFound(req, res) {
  res.status(404).render('pages/error');
}
function errorHandler(error, req, res) {
  res.status(500).render('pages/error');
}
// //=========================================================
//check the database for books and display them 
function getBooks(req,res) {
  let SQL = 'SELECT * FROM books;';
  client.query(SQL)
  .then( results => {
    res.render('pages/index', { results:results.rows })
    if(!results.rowCount) {
     res.render('pages/searches/new')
    } 
  }).catch(err => console.log(err));
}

//get a book from the databased on id
function getOneBook(req,res) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let searchValues = [req.params.id];

  return client.query(SQL, searchValues)
    .then( result => {
      return res.render(`pages/books/${result.rows[0].id}`, {
        book: result.row[0]
      });
    })
    .catch( err => console.log(err));
}
let booksArray = [];
//Book constuctor 
function Book(info) {
  this.title = info.volumeInfo.title || 'No title available';
  this.book_id = info.id;
  this.image_url = `http://books.google.com/books/content?id=${this.book_id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
  this.author = info.volumeInfo.authors || 'Author(s) Not available';
  this.description = info.volumeInfo.description || 'Description Not available';
  this.isbn = info.volumeInfo.industryIdentifiers[0].identifier;
  // this.bookshelf = bookshelf
  // console.log(this);
  booksArray.push(this);
}
//Add a book to the DB
function getBookForm(req, res) {
  res.render('pages/searches/new');
}

function createBook(req,res){
  let {book_id, title, author, isbn, image_url, description, bookshelf} = req.body;
  let SQL = 'INSERT INTO books(book_id, title, author, isbn, image_url, description, bookshelf) VALUES ($1,$2,$3,$4,$5,$6,$7);';
  saveValues = [book_id, title, author, isbn, image_url, description, bookshelf];
  client.query(SQL, saveValues)
    .then(()  => {
      SQL = 'SELECT * from books WHERE isbn = $4;';
      saveValues = [req.body.isbn];
    })
    client.query(SQL, saveValues)
      .then(result => {
        res.redirect(`/books/${result.rows[0].id}`)
      }) 
    .catch(err => console.log(err));

}

//search for books in Google
function searchForBooks(req, res) {
  console.log('I am inside of this function')
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(req.body.search);

  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }
 superagent
   .get(url)
   .then(apiResponse =>
     apiResponse.body.items.map(result => new Book(result))
   )
   .then(results =>
     res.render("pages/searches/show", { searchResults: booksArray })
  ).catch(err => console.log(err));
  //  .catch(error => errorHandler(error, req, res));
}


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
