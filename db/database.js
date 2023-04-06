const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: '127.0.0.1',
  database: 'lightbnb',
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query('SELECT * FROM users WHERE email=$1', [email])
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query('SELECT * FROM users WHERE id=$1', [id])
    .then((res) => {
      console.log(res.rows);
    })
    .catch((err) => {
      console.log(err);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query('INSERT INTO users (name, password, email) VALUES ($1, $2, $3)', [
      user.name,
      user.password,
      user.email,
    ])
    .then((res) => {
      console.log(res.rows);
    })
    .catch((err) => {
      console.log(err);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `
      SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date FROM reservations
      JOIN properties ON (properties.id=reservations.property_id)
      WHERE guest_id = $1
      LIMIT $2;
  `,
      [guest_id, limit]
    )
    .then((res) => {
      console.log(res);
      return res.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  // 1
  const queryParams = [];
  let isAnd = false;

  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
    isAnd = true;
  }

  // 4
  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryString += `${isAnd ? 'AND' : 'WHERE'} 
      properties.owner_id LIKE $${queryParams.length}
    `;
    isAnd = true;
  }

  // 5
  if (options.minimum_price_per_night && options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.push(options.maximum_price_per_night);
    queryString += `${isAnd ? 'AND' : 'WHERE'} 
      cost_per_night > $${queryParams.length - 1}
      AND cost_per_night < $${queryParams.length}
    `;
    isAnd = true;
  }

  // 6
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `${isAnd ? 'AND' : 'WHERE'} property_reviews.rating > $${
      queryParams.length
    }`;
    isAnd = true;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryParams, options);
  console.log(queryString);
  // 5
  return pool
    .query(queryString, queryParams)
    .then((res) => {
      return res.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
  } = property;

  return pool.query(
    `
    INSERT INTO properties 
    (
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms,
      country,
      street,
      city,
      province,
      post_code
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    RETURNING *;
  `,
    [
      owner_id,
      title,
      description,
      thumbnail_photo_url,
      cover_photo_url,
      cost_per_night,
      parking_spaces,
      number_of_bathrooms,
      number_of_bedrooms,
      country,
      street,
      city,
      province,
      post_code,
    ]
  );
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
