'use strict';
require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
require('ejs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({extended:true}));//access request.body
app.use(express.static(__dirname + '/public'));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}))
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));
app.set('view engine', 'ejs');

//API Routes
app.get('/', getBooks);
app.post('/searches', searchForBooks); //add new book
app.get('/searches/new', getBookForm); //book search form

app.post('/books', createBook);//save book from google to db

app.get('/books/:book_id', getOneBook); //get details for one book
app.put('/update/:book_id', updateBook)

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
   console.log('I viewed a book');
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let searchValues = [req.params.book_id];

  return client.query(SQL, searchValues)
    .then( result => {
      return res.render(`pages/books/show`, { book: result.rows[0] });
    })
    .catch( err => console.log(err));
}
let booksArray = [];
//Book constuctor 
function Book(info) {
  this.book_id = info.id;
  this.title = info.volumeInfo.title || 'No title available';
  this.author = info.volumeInfo.authors || 'Author(s) Not available';
  this.image_url = `http://books.google.com/books/content?id=${info.id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api` || 'http://placehold.it/200x300';
  this.isbn = info.volumeInfo.industryIdentifiers[0].identifier;
  this.description = info.volumeInfo.description || 'Description Not available';
  // console.log(this.image_url);
  booksArray.push(this);
}
//Add a book to the DB
function getBookForm(req, res) {
  res.render('pages/searches/new');
}
//save book to a database
function createBook(req,res){
   console.log('I created a book');
  let {book_id, title, author, isbn, image_url, description, bookshelf} = req.body;
  let SQL = 'INSERT INTO books(book_id, title, author, isbn, image_url, description, bookshelf) VALUES ($1,$2,$3,$4,$5,$6,$7);';
  let saveValues = [book_id, title, author, isbn, image_url, description, bookshelf];
  client.query(SQL, saveValues)
    .then(()  => {
      SQL = 'SELECT * from books WHERE book_id=$1;';
      saveValues = [req.body.book_id];
    client.query(SQL, saveValues)
      .then(result => {
        console.log(result.rows[0])
        res.redirect(`/books/${result.rows[0].book_id}`)
    }) 
  }) 
    .catch(err => console.log(err));
}

//search for books in Google
function searchForBooks(req, res) {
  console.log('I searched for books');
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(req.body);

  if (req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}&max-results=10`; }
  if (req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}&max-results=10`; }
 superagent
   .get(url)
   .then(apiResponse =>
     apiResponse.body.items.map(result => new Book(result))
   )
   .then(results => {
      res.render('pages/searches/show', { searchResults: booksArray })
      // console.log(booksArray);
   }
    
  ).catch(err => console.log(err));
  //  .catch(error => errorHandler(error, req, res));
}

function updateBook(req, res) {
  // destructure variables
  let {book_id, title, author, isbn, image_url, description, bookshelf} = req.body;
  // need SQL to update the specific task that we were on
  let SQL = `UPDATE books SET book_id=$1, title=$2, author=$3, isbn=$4, image_url=$5, description=$6, bookshelf=$7 WHERE id=$8;`;
  // use request.params.task_id === whatever task we were on
  let values = [book_id, title, author, isbn, image_url, description, bookshelf, req.params.book_id];

  client.query(SQL, values)
    .then(res.redirect(`/books/${req.params.book_id}`))
    .catch(err => handleError(err, res));
}

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
