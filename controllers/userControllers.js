const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const logout = function (req, res, next) {
  req.session.userId = null;
  res.send({});
};

const login = function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  db.query('SELECT * FROM users WHERE email=$1;', [email], (err, user) => {
    if (!user) {
      return res.send({ error: 'no user with that id' });
    }

    if (!bcrypt.compareSync(password, user.rows[0].password)) {
      return res.send({ error: 'error' });
    }

    if (err) {
      return res.send(err);
    }

    req.session.userId = user.rows[0].id;
    res.send({ user: { ...user.rows[0] } });
  });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (req, res, next) {
  const userId = req.session.userId;

  if (!userId) {
    return res.send({ message: 'not logged in' });
  }

  db.query('SELECT * FROM users WHERE id=$1', [userId], (err, user) => {
    if (!user) {
      return user.send({ error: 'no user with that id' });
    }

    if (err) {
      return err;
    }

    res.send({
      user: {
        name: user.name,
        email: user.email,
        id: userId,
      },
    });
  });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const signup = function (req, res, next) {
  const newUser = req.body;
  newUser.password = bcrypt.hashSync(newUser.password, 12);

  db.query(
    'INSERT INTO users (name, password, email) VALUES ($1, $2, $3)',
    [newUser.name, newUser.password, newUser.email],
    (err, user) => {
      if (err) {
        user.send(err);
      }

      req.session.userId = user.rows[0].id;
      res.send('🤗');
    }
  );
};

module.exports = { login, getUserWithId, signup, logout };
