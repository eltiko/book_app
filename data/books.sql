DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  book_id VARCHAR(255),
  title VARCHAR(255),
  author VARCHAR(255),
  isbn VARCHAR(255), 
  image_url VARCHAR(255),
  description TEXT, 
  bookshelf VARCHAR(255)
);

INSERT INTO books
  (book_id, title, author, isbn, image_url, description, bookshelf)
VALUES('2342435fwrw', 'sample book title', 'Some Guy', 532211455625, 'http:
//placehold.it/200x300', 'my favorite book to read about a thing', 'mystery');