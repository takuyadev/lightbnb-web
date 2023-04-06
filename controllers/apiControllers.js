const db = require('../db');

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (req, res, next) {
  const userId = req.session.userId;
  const limit = 10;

  if (!userId) {
    return res.send({ error: 'error' });
  }

  return db.query(
    'SELECT reservations.id, properties.title, properties.cost_per_night, reservations start_date FROM reservations JOIN properties ON (properties.id=reservations.property_id) WHERE guest_id = $1 LIMIT $2;',
    [userId, limit],
    (err, reservation) => {
      if (err) {
        return res.send(err);
      }
      res.send({ reservations: reservation.rows });
    }
  );
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (req, res, next) => {
  const options = req.query;
  const limit = 20;

  // 1
  const queryParams = [];
  let isAnd = false;

  // 2
  let queryString =
    'SELECT properties.*, avg(property_reviews.rating) as average_rating FROM properties JOIN property_reviews ON properties.id = property_id';

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length} `;
    isAnd = true;
  }

  // 4
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += ` ${isAnd ? 'AND' : 'WHERE'} properties.owner_id=$${
      queryParams.length
    } `;
    isAnd = true;
  }

  // 5
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.push(options.maximum_price_per_night);
    queryString += ` ${isAnd ? 'AND' : 'WHERE'} cost_per_night > $${
      queryParams.length - 1
    } AND cost_per_night < $${queryParams.length}`;
    isAnd = true;
  }

  // 6
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += ` ${isAnd ? 'AND' : 'WHERE'} property_reviews.rating > $${
      queryParams.length
    }`;
    isAnd = true;
  }

  // 4
  queryParams.push(limit);
  queryString += ` GROUP BY properties.id ORDER BY cost_per_night LIMIT $${queryParams.length}; `;

  // 5
  db.query(queryString, queryParams, (err, property) => {
    if (err) {
      return res.send(err);
    }

    res.send({ properties: property.rows });
  });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (req, res, next) {
  const userId = req.session.userId;
  const newProperty = req.body;
  newProperty.owner_id = userId;

  if (!userId) {
    return res.send({ error: 'error' });
  }

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
  } = newProperty;

  db.query(
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
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    );
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
    ],
    (err, property) => {
      if (err) {
        res.send(err);
      }
      res.send(property.rows[0]);
    }
  );
};

module.exports = { getAllProperties, getAllReservations, addProperty };
