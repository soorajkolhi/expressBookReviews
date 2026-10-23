const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// ---------- Register ----------
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// ---------- Basic routes (Promise based) ----------
// Get all books
public_users.get('/', (req, res) => {
  new Promise((resolve) => resolve(books))
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)));
});

// Get by ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  new Promise((resolve, reject) => {
    const book = books[req.params.isbn];
    book ? resolve(book) : reject("Book not found");
  })
    .then((book) => res.status(200).json(book))
    .catch((err) => res.status(404).json({ message: err }));
});

// Get by author
public_users.get('/author/:author', (req, res) => {
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter((k) => books[k].author.toLowerCase() === req.params.author.toLowerCase())
      .map((k) => ({ isbn: k, ...books[k] }));
    result.length ? resolve(result) : reject("No books found for this author");
  })
    .then((r) => res.status(200).json({ booksbyauthor: r }))
    .catch((err) => res.status(404).json({ message: err }));
});

// Get by title
public_users.get('/title/:title', (req, res) => {
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter((k) => books[k].title.toLowerCase() === req.params.title.toLowerCase())
      .map((k) => ({ isbn: k, ...books[k] }));
    result.length ? resolve(result) : reject("No books found with this title");
  })
    .then((r) => res.status(200).json({ booksbytitle: r }))
    .catch((err) => res.status(404).json({ message: err }));
});

// Get reviews
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json(book.reviews);
});

// ---------- Axios client functions (async/await + promise callbacks) ----------
// Get all books using async/await
const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error.message);
  }
};

// Get by ISBN using Promise callbacks
const getBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => console.error("Error:", error.message));
};

// Get by author using async/await
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Get by title using Promise callbacks
const getBooksByTitle = (title) => {
  return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data)
    .catch((error) => console.error("Error:", error.message));
};

// Endpoints to demo the Axios functions
public_users.get('/axios/books', async (req, res) => res.json(await getAllBooks()));
public_users.get('/axios/isbn/:isbn', async (req, res) => res.json(await getBookByISBN(req.params.isbn)));
public_users.get('/axios/author/:author', async (req, res) => res.json(await getBooksByAuthor(req.params.author)));
public_users.get('/axios/title/:title', async (req, res) => res.json(await getBooksByTitle(req.params.title)));

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;